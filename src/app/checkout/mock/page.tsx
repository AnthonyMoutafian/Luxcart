'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { confirmMockPayment } from './actions'

export default function MockPaymentPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      await confirmMockPayment(orderId)
      // Redirect to success URL (usually account page)
      router.push('/account')
    } catch (error) {
      alert('Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (!orderId) {
    return <div className="p-8">Invalid Order ID</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Stripe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure Payment via Stripe
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Order Summary
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Order ID: {orderId}</p>
                  <p className="font-bold mt-1">Amount: ${amount}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay with Stripe'}
          </button>
          
          <button
             onClick={() => router.back()}
             className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
             Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
