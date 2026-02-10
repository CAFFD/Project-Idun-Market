'use client'

import React, { useEffect, useState } from 'react'
import { getOrders, updateOrderStatus } from '@/lib/orderService'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, AlertCircle, Archive, Loader2, ChevronRight, Package, User } from 'lucide-react'
import { toast } from 'sonner'
import { OrderDetailsModal } from './OrderDetailsModal'
import { OrderActionModal } from './OrderActionModal'
import { getWhatsappMessage, WhatsappMessageType } from '@/lib/whatsappTemplates'
import { openWhatsapp } from '@/lib/whatsapp'

import { Order } from '@/lib/types'

const TABS = [
    { id: 'queue', label: 'Fila de Produção', icon: Clock },
    { id: 'problems', label: 'Problemas', icon: AlertCircle },
    { id: 'history', label: 'Histórico', icon: Archive },
]


export function AdminOrdersView() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('queue')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [actionModal, setActionModal] = useState<{ isOpen: boolean, mode: 'problem' | 'cancel' | 'resume', orderId: string | null }>({
        isOpen: false,
        mode: 'problem',
        orderId: null
    })

    useEffect(() => {
        loadOrders()
        const interval = setInterval(loadOrders, 30000)
        return () => clearInterval(interval)
    }, [])

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

    const handleStatusChange = async (orderId: string, newStatus: string, reason?: string) => {
        const oldOrders = [...orders]
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, cancel_reason: reason } : o))

        try {
            await updateOrderStatus(orderId, newStatus, reason)
            toast.success('Status atualizado!')
            
            // Send WhatsApp for Canceled OR Problem
            if (reason && (newStatus === 'canceled' || newStatus === 'problem')) {
                const order = orders.find(o => o.id === orderId)
                if (order && order.customer_phone) {
                     const msg = getWhatsappMessage(newStatus as WhatsappMessageType, {
                        customerName: order.customer_name,
                        orderId: order.id,
                        reason: reason
                    })
                    openWhatsapp(order.customer_phone, msg)
                }
            }

        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            toast.error('Erro ao atualizar status')
            setOrders(oldOrders)
        }
    }

    const openActionModal = (orderId: string, mode: 'problem' | 'cancel' | 'resume') => {
        setActionModal({ isOpen: true, mode, orderId })
    }

    const handleActionSubmit = (status: string, reason?: string) => {
        if (actionModal.orderId) {
            handleStatusChange(actionModal.orderId, status, reason)
            setActionModal({ ...actionModal, isOpen: false })
        }
    }


    // Filter & Sort Logic
    const filteredOrders = orders
        .filter(o => {
            if (activeTab === 'queue') return ['pending', 'preparing', 'sent'].includes(o.status)
            if (activeTab === 'problems') return ['problem'].includes(o.status)
            if (activeTab === 'history') return ['delivered', 'canceled'].includes(o.status)
            return false
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()

            // FIFO for Queue (Oldest first - "Don't let orders rot")
            if (activeTab === 'queue') {
                return dateA - dateB 
            }
            
            // LIFO for History & Problems (Newest first - "See what just finished/happened")
            return dateB - dateA 
        })

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tabs - Scrollable on mobile */}
            <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 md:gap-0 md:bg-gray-100/80 md:rounded-xl md:backdrop-blur-sm md:w-fit md:p-1 scrollbar-hide">
                {TABS.map((tab) => {
                    const Icon = tab.icon
                    const count = orders.filter(o => {
                         if (tab.id === 'queue') return ['pending', 'preparing', 'sent'].includes(o.status)
                         if (tab.id === 'problems') return ['problem'].includes(o.status)
                         if (tab.id === 'history') return false
                         return false
                    }).length

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap md:flex-none flex-shrink-0 ${
                                activeTab === tab.id 
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 md:ring-0' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 bg-gray-50 md:bg-transparent'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                                    tab.id === 'problems' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* List View */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Package size={48} className="mx-auto mb-3 text-gray-200" />
                        <p className="font-medium">Nenhum pedido nesta lista.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredOrders.map(order => (
                            <CockpitRow 
                                key={order.id} 
                                order={order} 
                                onClick={() => setSelectedOrder(order)}
                                onAction={(mode) => openActionModal(order.id, mode)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <OrderDetailsModal 
                order={selectedOrder} 
                onClose={() => setSelectedOrder(null)} 
                onStatusChange={handleStatusChange} 
            />

            <OrderActionModal 
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal({ ...actionModal, isOpen: false })}
                mode={actionModal.mode}
                onSubmit={handleActionSubmit}
            />
        </div>
    )
}

function CockpitRow({ order, onClick, onAction }: { order: Order, onClick: () => void, onAction: (mode: 'problem' | 'cancel' | 'resume') => void }) {
    const timeElapsed = formatDistanceToNow(new Date(order.created_at), { locale: ptBR, addSuffix: false })
        .replace('cerca de ', '')

    const statusColors: Record<string, string> = {
        'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'preparing': 'bg-blue-50 text-blue-700 border-blue-200',
        'sent': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'delivered': 'bg-green-50 text-green-700 border-green-200',
        'problem': 'bg-red-50 text-red-700 border-red-200',
        'canceled': 'bg-gray-50 text-gray-600 border-gray-200',
    }

    const statusLabels: Record<string, string> = {
        'pending': 'Pendente',
        'preparing': 'Preparando',
        'sent': 'Enviado',
        'delivered': 'Entregue',
        'problem': 'Problema',
        'canceled': 'Cancelado',
    }

    return (
        <div 
            onClick={onClick}
            className={`group relative p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center gap-3 md:gap-4 active:bg-gray-100 ${
                order.status === 'canceled' 
                    ? 'bg-red-50 hover:bg-red-100 border-red-500/30' 
                    : order.status === 'delivered'
                        ? 'bg-green-50 hover:bg-green-100 border-green-500/30'
                        : ''
            }`}
        >
            {/* Mobile Header: ID & Name */}
            <div className="flex justify-between items-start md:w-1/4">
                <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-gray-400">#{order.id.slice(0, 4)}</span>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{order.customer_name}</h3>
                </div>
                {/* Mobile Chevron (visible only on mobile) */}
                <span className="md:hidden text-gray-300">
                    <ChevronRight size={18} />
                </span>
            </div>

            {/* Status & Time (Row 2 on Mobile, Center on Desktop) */}
            <div className="flex items-center gap-2 md:justify-center md:flex-1">
                 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {statusLabels[order.status] || order.status}
                 </div>
                 
                 <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                    <Clock size={12} />
                    {timeElapsed}
                 </div>
            </div>

            {/* Problem Actions */}
            {order.status === 'problem' && (
                <div className="md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 flex items-center gap-2 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onAction('resume')}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md hover:bg-blue-200 transition-colors"
                    >
                        ↩️ Retomar
                    </button>
                    <button
                        onClick={() => onAction('cancel')}
                        className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-md hover:bg-red-200 transition-colors"
                    >
                        ❌ Cancelar
                    </button>
                </div>
            )}

            {/* Queue Actions - Problem Button */}
            {['pending', 'preparing', 'sent'].includes(order.status) && (
                 <div className="md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 hidden group-hover:flex items-center gap-2 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onAction('problem')}
                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md hover:bg-yellow-200 transition-colors flex items-center gap-1"
                    >
                        <AlertCircle size={14} />
                        Problema
                    </button>
                 </div>
            )}

            {/* Canceled Info */}
            {(order.status === 'canceled') && (
                <div className="md:absolute md:right-20 md:top-1/2 md:-translate-y-1/2 mt-1 md:mt-0">
                     {order.cancel_reason ? (
                        <span className="text-[10px] text-red-700 font-bold bg-white/50 px-2 py-1 rounded border border-red-200 max-w-[200px] truncate block">
                            Motivo: {order.cancel_reason}
                        </span>
                     ) : (
                        <span className="text-[10px] text-red-700 font-bold bg-white/50 px-2 py-1 rounded border border-red-200">
                             Cancelado
                        </span>
                     )}
                </div>
            )}

            {/* Price (Row 3 on Mobile, Right on Desktop) - Hide if problem to make space for buttons on mobile? No, keep it. */}
            {order.status !== 'problem' && (
                 <div className="flex items-center justify-between md:justify-end md:w-1/4">
                    <span className={`font-bold text-base md:text-sm ${order.status === 'canceled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                    </span>
                    
                    <button className="hidden md:block p-2 text-gray-300 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}
