'use client'

import React from 'react'
import { useCart } from '@/store/useCart'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function FloatingCartBar() {
    const { items } = useCart()
    const router = useRouter()

    if (items.length === 0) return null

    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)
    const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    const formattedTotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(totalPrice)

    const handleOpenCart = () => {
        router.push('/checkout')
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none mb-2 md:mb-4">
            <button 
                onClick={handleOpenCart}
                className="pointer-events-auto mx-auto max-w-5xl w-full bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between py-4 px-8 hover:bg-emerald-700 transition-colors cursor-pointer"
            >
                {/* Left Side: Icon & Count */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <ShoppingBag size={28} />
                        <span className="absolute -top-1 -right-1 bg-white text-emerald-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {totalQuantity}
                        </span>
                    </div>
                    <span className="font-semibold text-xl">Ver sacola</span>
                </div>

                {/* Right Side: Total & Chevron */}
                <div className="flex items-center gap-3">
                    <span className="font-bold text-xl tracking-wide">{formattedTotal}</span>
                    <ChevronRight size={24} className="opacity-80" />
                </div>
            </button>
        </div>
    )
}
