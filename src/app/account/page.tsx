import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Download } from 'lucide-react'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back, {user.email}
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Order History</h2>

          <div className="mt-6 space-y-10">
            {orders?.map((order) => (
              <div key={order.id} className="border-t border-gray-200 pt-10">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <dl className="grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="font-medium text-gray-900">Order number</dt>
                      <dd className="mt-1 text-gray-500">{order.id.substring(0, 8)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Date placed</dt>
                      <dd className="mt-1 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Total amount</dt>
                      <dd className="mt-1 font-medium text-gray-900">${order.total_amount}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Status</dt>
                      <dd className="mt-1 font-medium text-gray-900 capitalize">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {order.payment_status}
                         </span>
                      </dd>
                    </div>
                  </dl>
                  <div className="flex-none">
                     {order.invoice_url && (
                        <InvoiceDownloadButton invoicePath={order.invoice_url} />
                     )}
                  </div>
                </div>

                <table className="mt-4 w-full text-gray-500 sm:mt-6">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col" className="sm:w-2/5 lg:w-1/3 sm:pr-8 sm:text-left">Product</th>
                      <th scope="col" className="hidden w-1/5 sm:table-cell sm:text-center">Price</th>
                      <th scope="col" className="hidden w-1/5 sm:table-cell sm:text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 border-b border-gray-200 text-sm sm:border-t">
                    {order.order_items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-6 pr-8">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden py-6 sm:table-cell sm:text-center">
                          ${item.price}
                        </td>
                        <td className="hidden py-6 sm:table-cell sm:text-center">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {orders?.length === 0 && (
               <p className="text-gray-500">You haven't placed any orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import InvoiceDownloadButton from '@/components/InvoiceDownloadButton'
