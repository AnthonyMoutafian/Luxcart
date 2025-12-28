import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import AddToCartButton from '@/components/AddToCartButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .limit(4)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-gray-900 text-white">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to Luxcart
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Your one-stop destination for luxury items. Experience the best shopping journey with us.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/store"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Shop Now
              </Link>
              {!user && (
                <Link href="/login" className="text-sm font-semibold leading-6 text-white">
                  Log in <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex justify-between items-center">
           <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Products</h2>
           <Link href="/store" className="text-indigo-600 hover:text-indigo-500 text-sm font-semibold">
              View All Products &rarr;
           </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {featuredProducts?.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.description?.substring(0, 50)}...</p>
                </div>
                <p className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</p>
              </div>
              <div className="mt-4 relative z-10">
                 <AddToCartButton productId={product.id} />
              </div>
            </div>
          ))}
          {featuredProducts?.length === 0 && (
             <div className="col-span-full text-center text-gray-500 py-12">
                No products available.
             </div>
          )}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to upgrade your lifestyle?
              <br />
              Start shopping today.
            </h2>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/store"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Go to Store
              </Link>
              <Link href="/contact" className="text-sm font-semibold leading-6 text-white">
                Contact Us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
