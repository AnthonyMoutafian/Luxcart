'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateInvoice } from '@/utils/invoice'
import { sendOrderConfirmation } from '@/utils/email'

export async function confirmMockPayment(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  // 1. Fetch Order details for Invoice
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

  if (!order) throw new Error('Order not found')

  // 2. Generate Invoice
  let invoiceUrl = null
  try {
     // generateInvoice uploads to storage and returns the path (key)
     invoiceUrl = await generateInvoice(order, order.order_items, user)
  } catch (error) {
     console.error('Failed to generate invoice:', error)
     // Continue even if invoice fails, but log it
  }

  // 3. Update Order Status
  const { error } = await supabase
    .from('orders')
    .update({ 
      payment_status: 'paid',
      order_status: 'processing',
      invoice_url: invoiceUrl
    })
    .eq('id', orderId)

  if (error) throw error

  // 4. Send Confirmation Email (Resend)
  try {
    await sendOrderConfirmation(orderId)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
  }

  // 5. Clear Cart
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single()
    
  if (cart) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
  }

  revalidatePath('/account')
  revalidatePath('/') // Update cart count in navbar
}
