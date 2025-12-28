'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToCart(productId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Please login to add items to cart')
  }

  // Check if user has a cart
  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cart) {
    const { data: newCart, error: createCartError } = await supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select('id')
      .single()

    if (createCartError) {
      throw new Error('Failed to create cart')
    }
    cart = newCart
  }

  // Check if item exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart!.id)
    .eq('product_id', productId)
    .single()

  if (existingItem) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)

    if (error) throw new Error('Failed to update cart item')
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart!.id,
        product_id: productId,
        quantity: quantity,
      })

    if (error) throw new Error('Failed to add item to cart')
  }

  revalidatePath('/', 'layout') // Revalidate layout to update navbar cart count
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const supabase = await createClient()
  
  if (quantity <= 0) {
    return removeCartItem(itemId)
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)

  if (error) throw new Error('Failed to update quantity')

  revalidatePath('/', 'layout')
}

export async function removeCartItem(itemId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error('Failed to remove item')

  revalidatePath('/', 'layout')
}
