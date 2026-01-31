'use client'

import React from 'react'
import { useCart } from '@/store/useCart'
import { X, Plus, Minus, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getStoreStatus } from '@/lib/storeService'

export function CartSheet() {
    const { items, isCartOpen, closeCart, addItem, decreaseItem, removeItem, totalPrice } = useCart()
    const router = useRouter()

    const subtotal = totalPrice()
    const deliveryFee = 5.90
    const finalTotal = subtotal + deliveryFee

    const [checking, setChecking] = React.useState(false)

    const handleCheckout = async () => {
        setChecking(true)
        try {
            const { isOpen } = await getStoreStatus()
            
            if (!isOpen) {
                toast.error('Loja Fechada 🌙', {
                    description: 'Desculpe, a loja fechou. Não é possível finalizar agora.',
                    duration: 4000,
                })
                setChecking(false)
                return
            }

            closeCart()
            router.push('/checkout')
        } catch (error) {
            console.error(error)
            setChecking(false)
        }
    }

    // REMOVED: if (!isCartOpen) return null -> To allow exit animations

    return (
        <div 
            className={`fixed inset-0 z-[60] flex items-end justify-center md:items-center pointer-events-none`}
        >
            {/* Backdrop - Fade In/Out */}
            <div 
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
                    isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeCart}
            />

            {/* Sheet - Slide In/Out */}
            <div 
                className={`
                    fixed bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out pointer-events-auto
                    w-full rounded-t-2xl md:rounded-none md:h-full md:max-w-md md:right-0 md:top-0 md:bottom-0
                    ${isCartOpen 
                        ? 'translate-y-0 md:translate-x-0' 
                        : 'translate-y-full md:translate-x-full'
                    }
                    max-h-[85vh] md:max-h-full bottom-0
                `}
            >
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Sua Sacola</h2>
                    <button 
                        onClick={closeCart}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 min-h-[200px]">
                            <span className="text-lg">Sua sacola está vazia</span>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                {/* Left: Name & Price */}
                                <div className="flex-1 pr-4">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                                        {item.name}
                                    </h3>
                                    <div className="text-base font-medium text-gray-600 mt-1">
                                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                    </div>
                                </div>
                                
                                {/* Right: Controls */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1.5">
                                        {item.quantity === 1 ? (
                                            <button 
                                                onClick={() => removeItem(item.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg shadow-sm hover:bg-red-200 transition-colors"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => decreaseItem(item.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-emerald-600 border border-gray-200"
                                            >
                                                <Minus size={20} />
                                            </button>
                                        )}
                                        
                                        <span className="text-base font-bold w-6 text-center text-gray-900">{item.quantity}</span>
                                        
                                        <button 
                                            onClick={() => addItem(item)}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-emerald-600 border border-gray-200"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 md:p-6 border-t border-gray-100 bg-white shrink-0">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-gray-600 text-base">
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 text-base">
                                <span>Taxa de entrega</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200 mt-2">
                                <span className="text-xl font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-emerald-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckout}
                            disabled={checking}
                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {checking ? (
                                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Finalizar Pedido</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
