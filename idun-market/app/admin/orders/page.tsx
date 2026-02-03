'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrders, updateOrderStatus } from '@/lib/orderService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Loader2, Package, Phone } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner' // Import Toast
import { getWhatsappMessage, WhatsappMessageType } from '@/lib/whatsappTemplates'
import { Order } from '@/lib/types'

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'preparing', label: 'Preparando', color: 'bg-blue-100 text-blue-800' },
    { value: 'sent', label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: 'Entregue', color: 'bg-green-100 text-green-800' },
    { value: 'problem', label: 'Problema / Divergência', color: 'bg-red-100 text-red-800' },
    { value: 'canceled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
]

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        loadOrders()
    }

    const loadOrders = async () => {
        try {
            const data = await getOrders()
            if (data) setOrders(data)
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error)
            toast.error('Erro ao carregar pedidos')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        // Optimistic UI Update
        const oldOrders = [...orders]
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

        try {
            await updateOrderStatus(orderId, newStatus)
            toast.success('Status atualizado!')
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            toast.error('Erro ao atualizar status')
            setOrders(oldOrders) // Revert on error
        }
    }

    const getStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0]
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${option.color}`}>
                {option.label}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
             {/* Header */}
             <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex items-center gap-4 shadow-sm">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="font-bold text-gray-800 text-lg">Pedidos</h1>
            </header>

            <main className="container mx-auto p-4 max-w-5xl">
                {orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                        <Package size={48} className="mb-4 text-gray-300" />
                        <p>Nenhum pedido encontrado.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile List (Cards) */}
                        <div className="md:hidden space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 8)}</span>
                                            <p className="font-bold text-gray-800">{order.customer_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                            </p>
                                            <p className="font-bold text-emerald-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                                         {/* Status Select */}
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none"
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            
                                            {/* WhatsApp Notification Button */}
                                            {order.customer_phone && (
                                                <button
                                                    onClick={() => {
                                                        const msg = getWhatsappMessage(order.status as WhatsappMessageType, {
                                                            customerName: order.customer_name,
                                                            orderId: order.id,
                                                            addressStreet: order.customer_address,
                                                            storeName: 'Idun Market'
                                                        })
                                                        window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                                                    }}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                                    title="Notificar Cliente"
                                                >
                                                    <Phone size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 w-32">Data</th>
                                        <th className="p-4 font-semibold text-gray-600">Cliente</th>
                                        <th className="p-4 font-semibold text-gray-600">Total</th>
                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                        {/* <th className="p-4 font-semibold text-gray-600 text-right">Ações</th> */}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-500">
                                                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">
                                                {order.customer_name}
                                                <span className="block text-xs text-gray-400 font-mono mt-0.5">#{order.id.slice(0, 8)}</span>
                                            </td>
                                            <td className="p-4 font-bold text-emerald-600">
                                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <select 
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2 outline-none cursor-pointer hover:border-gray-300 transition-colors"
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    {/* WhatsApp Notification Button */}
                                                    {order.customer_phone && (
                                                        <button
                                                            onClick={() => {
                                                                const msg = getWhatsappMessage(order.status as WhatsappMessageType, {
                                                                    customerName: order.customer_name,
                                                                    orderId: order.id,
                                                                    addressStreet: order.customer_address,
                                                                    storeName: 'Idun Market'
                                                                })
                                                                window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                                                            }}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                                            title="Notificar Cliente"
                                                        >
                                                            <Phone size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
