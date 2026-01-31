'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/store/useCart'

export function HeaderCartButton() {
    const { openCart, items } = useCart()
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <button 
            onClick={openCart}
            className="p-2 text-gray-600 hover:text-emerald-600 transition-colors relative"
            aria-label="Abrir sacola de compras"
        >
            <ShoppingCart size={24} />
            {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalQuantity}
                </span>
            )}
        </button>
    )
}
