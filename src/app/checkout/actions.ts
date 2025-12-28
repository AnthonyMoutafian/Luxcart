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

  // 4. Initiate Payment (Stripe)
  try {
    // Currently using simulated Stripe payment page until verification is complete
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/mock?orderId=${order.id}&amount=${totalAmount}`
    
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

// Deprecated: Pay4Work integration (removed for Stripe migration)
// async function createPaymentLink(orderId: string, amount: number, items: any[]) { ... }
