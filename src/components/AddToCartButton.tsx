'use client'

import { useState } from 'react'
import { addToCart } from '@/app/cart/actions'
import { useTransition } from 'react'
import { ShoppingCart } from 'lucide-react'

export default function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        await addToCart(productId, quantity)
        alert('Added to cart!')
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  return (
    <div className="relative z-10 flex items-center space-x-2">
      <div className="flex items-center border border-gray-300 rounded">
        <button
          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuantity(Math.max(1, quantity - 1));
          }}
        >
          -
        </button>
        <span className="px-2 text-gray-900">{quantity}</span>
        <button
          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuantity(quantity + 1);
          }}
        >
          +
        </button>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAddToCart();
        }}
        disabled={isPending}
        className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Adding...' : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </>
        )}
      </button>
    </div>
  )
}
