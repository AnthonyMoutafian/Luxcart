import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { generateInvoice } from '@/utils/invoice'
import { sendOrderConfirmation } from '@/utils/email'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = (await headers()).get('x-webhook-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const secret = process.env.PAY4WORK_WEBHOOK_SECRET
  if (!secret) {
    console.error('PAY4WORK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  // Verify signature
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(body).digest('hex')

  if (signature !== digest) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  
  if (event.type === 'payment.success') {
    const orderId = event.data.order_id
    const supabase = await createClient()

    // 1. Fetch Order with Items for Invoice
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (!order) {
       console.error('Order not found for webhook', orderId)
       return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Fetch User for Invoice
    const { data: { user } } = await supabase.auth.admin.getUserById(order.user_id)
    if (!user) {
        // Fallback or error
        console.error('User not found for order', order.user_id)
        // We can still proceed but invoice might miss details
    }

    // 3. Generate Invoice
    let invoiceUrl = null
    try {
        invoiceUrl = await generateInvoice(order, order.order_items, user || { email: 'unknown' })
    } catch (e) {
        console.error('Failed to generate invoice', e)
    }

    // 4. Update Order Status and Invoice URL
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'processing',
        invoice_url: invoiceUrl
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 5. Clear User's Cart
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', order.user_id)
      .single()

    if (cart) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id)
    }

    // 6. Trigger Email Notification
    try {
        await sendOrderConfirmation(orderId)
    } catch (e) {
        console.error('Failed to send email', e)
    }
  }

  return NextResponse.json({ received: true })
}
