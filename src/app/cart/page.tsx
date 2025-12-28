import { createClient } from '@/utils/supabase/server'
import { updateCartItemQuantity, removeCartItem } from './actions'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="mb-8">Please login to view your cart.</p>
        <Link
          href="/login"
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
        >
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
          price,
          image_url
        )
      )
    `)
    .eq('user_id', user.id)
    .single()

  const cartItems = cart?.cart_items || []
  const subtotal = cartItems.reduce((acc: number, item: any) => {
    return acc + (item.product.price * item.quantity)
  }, 0)

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">Items in your shopping cart</h2>

            <ul role="list" className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {cartItems.map((item: any) => (
                <li key={item.id} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-md bg-gray-200 flex items-center justify-center text-gray-400 sm:h-48 sm:w-48">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <Link href={`/store`} className="font-medium text-gray-700 hover:text-gray-800">
                              {item.product.name}
                            </Link>
                          </h3>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900">${item.product.price.toFixed(2)}</p>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <label htmlFor={`quantity-${item.id}`} className="sr-only">
                          Quantity, {item.product.name}
                        </label>
                        <div className="flex items-center space-x-2">
                           <form action={async () => {
                              'use server'
                              await updateCartItemQuantity(item.id, item.quantity - 1)
                           }}>
                              <button className="p-1 border rounded">-</button>
                           </form>
                           <span>{item.quantity}</span>
                           <form action={async () => {
                              'use server'
                              await updateCartItemQuantity(item.id, item.quantity + 1)
                           }}>
                              <button className="p-1 border rounded">+</button>
                           </form>
                        </div>

                        <div className="absolute right-0 top-0">
                          <form action={removeCartItem.bind(null, item.id)}>
                             <button type="submit" className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500">
                               <span className="sr-only">Remove</span>
                               <Trash2 className="h-5 w-5" aria-hidden="true" />
                             </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {cartItems.length === 0 && (
                <li className="py-6 text-center text-gray-500">
                  Your cart is empty.
                </li>
              )}
            </ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <Link
                href="/checkout"
                className={`w-full flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${cartItems.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Checkout
              </Link>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}
