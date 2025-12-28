import { createClient } from '@/utils/supabase/server'
import { processCheckout } from './actions'
import Link from 'next/link'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p>Please login to checkout.</p>
        <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
          Login
        </Link>
      </div>
    )
  }

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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p>Your cart is empty.</p>
        <Link href="/store" className="text-indigo-600 hover:text-indigo-500">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const cartItems = cart.cart_items
  const totalAmount = cartItems.reduce((acc: number, item: any) => {
    return acc + (item.product.price * item.quantity)
  }, 0)

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Checkout</h1>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-6">
            <ul role="list" className="divide-y divide-gray-200">
              {cartItems.map((item: any) => (
                <li key={item.id} className="flex py-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between">
              <dt className="text-base font-medium text-gray-900">Total</dt>
              <dd className="text-base font-medium text-gray-900">${totalAmount.toFixed(2)}</dd>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <form action={processCheckout}>
            <button
              type="submit"
              className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Pay Now
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
