'use client'

import Link from 'next/link'
import { ShoppingCart, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user: any
  cartCount: number
}

export default function Navbar({ user: initialUser, cartCount: initialCartCount }: NavbarProps) {
  const [user, setUser] = useState<any>(initialUser)
  const [cartCount, setCartCount] = useState(initialCartCount)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setUser(initialUser)
    setCartCount(initialCartCount)
  }, [initialUser, initialCartCount])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
         setCartCount(0)
      } else if (session.user.id !== user?.id) {
         // If user changed, refresh to get new cart count
         router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, user?.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800">
              Luxcart
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/store" className="text-gray-600 hover:text-gray-900">Store</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/account" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  Account
                </Link>
                <button onClick={handleSignOut} className="text-gray-600 hover:text-gray-900">
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
            )}

            <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
