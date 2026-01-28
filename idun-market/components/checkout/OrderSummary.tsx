import React from 'react'
import { useCart } from '@/store/useCart'
import { Loader2, ArrowRight } from 'lucide-react'

interface OrderSummaryProps {
    onCheckout: () => void
    loading: boolean
    canCheckout: boolean
}

export function OrderSummary({ onCheckout, loading, canCheckout }: OrderSummaryProps) {
    const { items, totalPrice } = useCart()
    const subtotal = totalPrice()
    const deliveryFee = 5.90
    const total = subtotal + deliveryFee

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
            <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
            
            {/* Items List (Compact) */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 line-clamp-1 flex-1 pr-2">
                            {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                 <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Entrega</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                    </span>
                </div>
            </div>

            <button
                onClick={onCheckout}
                disabled={loading || !canCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Processando...
                    </>
                ) : (
                    <>
                        <span>Finalizar Pedido</span>
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">
                Ao finalizar, enviaremos o pedido para o WhatsApp da loja.
            </p>
        </div>
    )
}
