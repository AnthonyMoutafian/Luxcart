import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { deleteProduct, toggleProductStatus } from './actions'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link
          href="/admin/products/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {products?.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-12 w-12 rounded-full object-cover mr-4"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-indigo-600 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.status}
                  </span>
                  
                  <Link
                    href={`/admin/products/edit/${product.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>

                  <form action={toggleProductStatus.bind(null, product.id, product.status)}>
                    <button className="text-sm text-blue-600 hover:text-blue-900">
                      {product.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <button className="text-sm text-red-600 hover:text-red-900">Delete</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
          {products?.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              No products found.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
