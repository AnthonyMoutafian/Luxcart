'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmMockPayment(orderId: string) {
  const supabase = await createClient()
  
  // 1. Update Order Status
  const { error } = await supabase
    .from('orders')
    .update({ 
      payment_status: 'paid',
      order_status: 'processing'
      // In a real app, we'd also trigger the invoice generation here or via webhook
    })
    .eq('id', orderId)

  if (error) throw error

  // 2. Clear Cart (simulating webhook effect)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
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
  }

  revalidatePath('/account')
  revalidatePath('/') // Update cart count in navbar
}
