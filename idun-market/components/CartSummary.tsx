'use client'

import { useCart } from '@/store/useCart'
import { ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function CartSummary() {
    const { totalPrice, totalItems } = useCart()
    const total = totalPrice()
    const count = totalItems()
    
    // Don't show if empty
    if (count === 0) return null

    const formattedTotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(total)

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 animate-slide-up">
            <div className="container mx-auto flex items-center justify-between max-w-lg md:max-w-4xl">
                <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Total com {count} item(s)</span>
                    <span className="text-xl font-bold text-gray-900">{formattedTotal}</span>
                </div>
                
                <Link
                    href="/checkout"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg"
                >
                    <ShoppingBag size={20} />
                    <span>Ver Carrinho</span>
                </Link>
            </div>
        </div>
    )
}
