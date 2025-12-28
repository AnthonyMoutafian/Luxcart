'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function processCheckout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Get Cart
  const { data: cart } = await supabase
    .from('carts')
    .select(`
      id,
      cart_items (
        id,
        quantity,
        product:products (
          id,
          name,
          price
        )
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
    throw new Error('Cart is empty')
  }

  const cartItems = cart.cart_items
  const totalAmount = cartItems.reduce((acc: number, item: any) => {
    return acc + (item.product.price * item.quantity)
  }, 0)

  // 2. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      payment_status: 'pending',
      order_status: 'pending'
    })
    .select('id')
    .single()

  if (orderError) {
    console.error('Order creation error:', orderError)
    throw new Error('Failed to create order')
  }

  // 3. Create Order Items
  const orderItems = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.product.price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items error:', itemsError)
    throw new Error('Failed to create order items')
  }

  // 4. Call Pay4Work API (or fallback to mock)
  try {
    let paymentUrl
    try {
      paymentUrl = await createPaymentLink(order.id, totalAmount, cartItems)
    } catch (apiError) {
      console.error('Pay4Work API failed, falling back to mock payment:', apiError)
      // Fallback to internal mock payment page
      paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/mock?orderId=${order.id}&amount=${totalAmount}`
    }
    
    // Update order with payment URL
    await supabase
      .from('orders')
      .update({ payment_url: paymentUrl })
      .eq('id', order.id)

    // Redirect to payment
    redirect(paymentUrl)
  } catch (error: any) {
     // If redirect happens in try block it catches here, so rethrow if it is redirect
     if (error.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
     }
     console.error('Payment Error:', error)
     throw new Error('Failed to initiate payment: ' + error.message)
  }
}

async function createPaymentLink(orderId: string, amount: number, items: any[]) {
  const apiKey = process.env.PAY4WORK_API_KEY
  
  if (!apiKey) {
    throw new Error('Payment configuration missing')
  }

  // Attempt to call the API
  try {
    const response = await fetch('https://app.pay4.work/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        order_id: orderId,
        amount: amount,
        currency: 'USD',
        description: `Order #${orderId}`,
        items: items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pay4work`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`
      })
    })

    if (!response.ok) {
       const text = await response.text();
       console.error('Pay4Work API response:', text);
       throw new Error(`Payment API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()
    return data.payment_url
  } catch (e) {
    // Re-throw to trigger fallback
    throw e
  }
}
