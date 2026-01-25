'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/store/useCart'
import Link from 'next/link'
import { ArrowLeft, Trash, Plus, Minus, Send, Loader2 } from 'lucide-react'
import { createOrder } from '@/lib/orderService'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
    const { items, addItem, decreaseItem, removeItem, totalPrice } = useCart()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('Pix')

    // Hydration fix for Zustand purely client-side
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const total = totalPrice()

    const handleFinish = async () => {
        if (!name || !address || !phone) {
            alert('Por favor, preencha nome, telefone e endereço.')
            return
        }

        setLoading(true)

        try {
            // 1. Salvar Pedido no Banco
            // Tentamos pegar o store_id do primeiro item do carrinho (assumindo pedido de loja única)
            const firstItemStoreId = items[0]?.store_id || null

            const { orderId, whatsappNumber, error } = await createOrder({
                customer_name: name,
                customer_phone: phone,
                customer_address: address,
                payment_method: paymentMethod,
                total_amount: total,
                store_id: firstItemStoreId
            }, items)

            if (error) {
                alert('Erro ao salvar pedido: ' + error)
                setLoading(false)
                return
            }

            // 2. Gerar Mensagem WhatsApp
            const itemsList = items
                .map((item) => `- ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`)
                .join('\n')

            const totalFormatted = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(total)

            const message = `*NOVO PEDIDO #${orderId?.slice(0, 8).toUpperCase()}*
            
Cliente: *${name}*
Contato: ${phone}
Endereço: ${address}
Pagamento: ${paymentMethod}


*Itens:*
${itemsList}

*Total: ${totalFormatted}*`

            const encodedMessage = encodeURIComponent(message)
            // Usa o número retornado do banco ou o fallback (caso a loja não tenha configurado)
            const targetNumber = whatsappNumber || '5511999999999' 
            const url = `https://wa.me/${targetNumber}?text=${encodedMessage}`

            // 3. Limpar Carrinho e Redirecionar
            items.forEach(item => removeItem(item.id)) // Limpa items um por um ou implementar clearCart no store
            window.open(url, '_blank')
            router.push('/') // Volta para home

        } catch (err) {
            console.error(err)
            alert('Erro inesperado ao processar pedido.')
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu carrinho está vazio 😢</h2>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                    <ArrowLeft size={20} />
                    Voltar as compras
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4">
                <div className="container mx-auto flex items-center gap-4">
                    <Link href="/" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Finalizar Pedido</h1>
                </div>
            </header>

            <div className="container mx-auto p-4 max-w-2xl">
                {/* Listagem de Itens */}
                <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Itens do Pedido</h2>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center">
                                {/* Imagem Pequena */}
                                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                                    )}
                                </div>

                                {/* Detalhes */}
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800 line-clamp-1">{item.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Unit: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                    </p>
                                </div>

                                {/* Controles */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1">
                                        <button onClick={() => decreaseItem(item.id)} className="p-1 text-gray-600 hover:text-emerald-600">
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                        <button onClick={() => addItem(item)} className="p-1 text-gray-600 hover:text-emerald-600">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => removeItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Formulário de Entrega */}
                <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Dados de Entrega</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ex: 11999999999"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Rua, Número, Bairro, Complemento..."
                                rows={2}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                            >
                                <option value="Pix">Pix</option>
                                <option value="Cartão de Crédito/Débito">Cartão de Crédito/Débito</option>
                                <option value="Dinheiro">Dinheiro</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Resumo e Ação */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg text-gray-600">Total a Pagar</span>
                        <span className="text-2xl font-bold text-emerald-700">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                        </span>
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Enviando Pedido...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Enviar Pedido no WhatsApp
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-2">
                        Ao clicar, você será redirecionado para o WhatsApp da loja para combinar a entrega.
                    </p>
                </div>
            </div>
        </div>
    )
}
