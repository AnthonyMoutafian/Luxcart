import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {orders?.map((order) => (
            <li key={order.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Order #{order.id.substring(0, 8)}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Total: ${order.total_amount}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      Items: {order.order_items[0].count}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Status Update Actions */}
                <div className="mt-4 flex space-x-2">
                   <form action={async () => {
                      'use server'
                      const supabase = await createClient()
                      await supabase.from('orders').update({ order_status: 'processing' }).eq('id', order.id)
                      revalidatePath('/admin/orders')
                   }}>
                      <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Mark Processing</button>
                   </form>
                   <form action={async () => {
                      'use server'
                      const supabase = await createClient()
                      await supabase.from('orders').update({ order_status: 'completed' }).eq('id', order.id)
                      revalidatePath('/admin/orders')
                   }}>
                      <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Mark Completed</button>
                   </form>
                </div>
              </div>
            </li>
          ))}
          {orders?.length === 0 && (
             <li className="px-4 py-4 text-center text-gray-500">No orders found.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
