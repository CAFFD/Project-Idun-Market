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
    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [historyOrders, setHistoryOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true) // Initial full-page load
    const [activeTab, setActiveTab] = useState('queue')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [actionModal, setActionModal] = useState<{ isOpen: boolean, mode: 'problem' | 'cancel' | 'resume', orderId: string | null }>({
        isOpen: false,
        mode: 'problem',
        orderId: null
    })

    // Polling for Active Orders (Silent)
    useEffect(() => {
        loadActiveOrders() // Initial load
        const interval = setInterval(() => {
            loadActiveOrders(true) // Silent poll
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    // Load History when tab changes to history
    useEffect(() => {
        if (activeTab === 'history' && historyOrders.length === 0) {
            loadHistoryOrders()
        }
    }, [activeTab])

    const loadActiveOrders = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const data = await getOrders({ scope: 'active' })
            if (data) setActiveOrders(data)
        } catch (error) {
            console.error('Erro ao buscar pedidos ativos:', error)
            if (!silent) toast.error('Erro ao carregar pedidos')
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const loadHistoryOrders = async () => {
        // History doesn't need global loading, maybe a local one or just update
        try {
            const data = await getOrders({ scope: 'history', limit: 50 })
            if (data) setHistoryOrders(data)
        } catch (error) {
            console.error('Erro ao buscar histórico:', error)
            toast.error('Erro ao carregar histórico')
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string, reason?: string) => {
        // Optimistic Update for UI
        const allOrders = [...activeOrders, ...historyOrders]
        const order = allOrders.find(o => o.id === orderId)
        
        if (!order) return

        // Update locally
        const updatedOrder = { 
            ...order, 
            status: newStatus, 
            cancel_reason: newStatus === 'canceled' ? reason : order.cancel_reason,
            problem_reason: newStatus === 'problem' ? reason : (newStatus !== 'problem' ? undefined : order.problem_reason) // Hygiene in UI
        }

        // Move between lists based on status
        if (['delivered', 'canceled'].includes(newStatus)) {
             setActiveOrders(prev => prev.filter(o => o.id !== orderId))
             setHistoryOrders(prev => [updatedOrder, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
        } else {
             setHistoryOrders(prev => prev.filter(o => o.id !== orderId))
             setActiveOrders(prev => {
                const existing = prev.find(o => o.id === orderId)
                if (existing) return prev.map(o => o.id === orderId ? updatedOrder : o)
                return [...prev, updatedOrder].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
             })
        }

        try {
            await updateOrderStatus(orderId, newStatus, reason)
            toast.success('Status atualizado!')
            
            // Re-fetch active to ensure consistency (optional, but good for sync)
            loadActiveOrders(true) 
            
            // Send WhatsApp ONLY for Canceled
            if (reason && newStatus === 'canceled' && order.customer_phone) {
                 const msg = getWhatsappMessage(newStatus as WhatsappMessageType, {
                    customerName: order.customer_name,
                    orderId: order.id,
                    reason: reason
                })
                openWhatsapp(order.customer_phone, msg)
            }

        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            toast.error('Erro ao atualizar status')
            // Revert changes if needed (complex complexity, skipping for now as simple reload fixes it)
            loadActiveOrders(true)
        }
    }

    const openActionModal = (orderId: string, mode: 'problem' | 'cancel' | 'resume') => {
        setActionModal({ isOpen: true, mode, orderId })
    }

    const handleNegotiate = (order: Order) => {
        if (!order.customer_phone) return toast.error('Cliente sem telefone cadastrado')
        
        const msg = getWhatsappMessage('negotiate', {
            customerName: order.customer_name,
            orderId: order.id,
            reason: order.problem_reason || 'Imprevisto no pedido'
        })
        openWhatsapp(order.customer_phone, msg)
    }

    const handleActionSubmit = (status: string, reason?: string) => {
        if (actionModal.orderId) {
            handleStatusChange(actionModal.orderId, status, reason)
            setActionModal({ ...actionModal, isOpen: false })
        }
    }


    // Filter & Sort Logic (Now simpler as we have pre-bucketed lists)
    let filteredOrders: Order[] = []
    
    if (activeTab === 'queue') {
        filteredOrders = activeOrders
            .filter(o => ['pending', 'preparing', 'sent'].includes(o.status))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // FIFO
    } else if (activeTab === 'problems') {
        filteredOrders = activeOrders
            .filter(o => o.status === 'problem')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // LIFO (Newest problems first)
    } else if (activeTab === 'history') {
        filteredOrders = historyOrders
            // Already sorted by getOrders but good to ensure
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        )
    }

    // Counts for tabs
    const queueCount = activeOrders.filter(o => ['pending', 'preparing', 'sent'].includes(o.status)).length
    const problemCount = activeOrders.filter(o => o.status === 'problem').length

    return (
        <div className="space-y-6">
            {/* Tabs - Scrollable on mobile */}
            <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 md:gap-0 md:bg-gray-100/80 md:rounded-xl md:backdrop-blur-sm md:w-fit md:p-1 scrollbar-hide">
                {TABS.map((tab) => {
                    const Icon = tab.icon
                    let count = 0
                    if (tab.id === 'queue') count = queueCount
                    if (tab.id === 'problems') count = problemCount

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
                                onAction={(mode) => {
                                    if (mode === 'negotiate') handleNegotiate(order)
                                    else openActionModal(order.id, mode)
                                }}
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

function CockpitRow({ order, onClick, onAction }: { order: Order, onClick: () => void, onAction: (mode: 'problem' | 'cancel' | 'resume' | 'negotiate') => void }) {
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
        'problem': 'PROBLEMA',
        'canceled': 'Cancelado',
    }

    const isProblem = order.status === 'problem'

    return (
        <div 
            onClick={onClick}
            className={`group relative p-4 transition-all cursor-pointer flex flex-col gap-3 border-l-4 ${
                isProblem ? 'border-l-amber-500 bg-amber-50 mx-2 my-2 rounded-lg shadow-sm border border-amber-200' :
                order.status === 'canceled' ? 'border-l-gray-300 hover:bg-gray-50' :
                order.status === 'delivered' ? 'border-l-emerald-500 hover:bg-gray-50' : 'border-l-transparent hover:bg-gray-50'
            } ${
                order.status === 'canceled' 
                    ? 'bg-red-50/50 hover:bg-red-50 border-y border-red-100' 
                    : order.status === 'delivered'
                        ? 'bg-green-50/30 hover:bg-green-50 border-y border-green-100'
                        : ''
            }`}
        >
            {/* HEADER: Main Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* ID & Name */}
                <div className="flex items-center gap-3 md:w-1/3">
                    <span className="text-xs font-mono font-bold text-gray-400 shrink-0">#{order.id.slice(0, 4)}</span>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{order.customer_name}</h3>
                </div>

                {/* Status & Time */}
                <div className="flex items-center gap-2 md:justify-center md:flex-1">
                     <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                         isProblem ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                         statusColors[order.status] || 'bg-gray-100 text-gray-700'
                     }`}>
                        {isProblem && <AlertCircle size={14} />}
                        {statusLabels[order.status] || order.status}
                     </div>
                     
                     <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                        <Clock size={12} />
                        {timeElapsed}
                     </div>
                </div>

                {/* Price & Chevron */}
                <div className="flex items-center justify-between md:justify-end md:w-1/4 gap-4">
                    <span className={`font-bold text-base md:text-sm ${order.status === 'canceled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                    </span>
                    
                    <span className="text-gray-300 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={20} />
                    </span>
                </div>
            </div>

            {/* FOOTER: Actions & Messages */}
            <div className="flex flex-col gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                
                {/* PROBLEM TAB: Resume/Cancel Actions */}
                {isProblem && (
                    <div className="flex flex-col gap-3 pt-2 border-t border-amber-200/50">
                        {/* THE REASON - WAR ROOM STYLE */}
                        <div className="flex items-start gap-2 text-amber-900 bg-amber-100/50 p-3 rounded-md border border-amber-200">
                             <AlertCircle size={18} className="shrink-0 mt-0.5" />
                             <div className="flex flex-col">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Motivo do Problema</span>
                                 <span className="font-bold text-sm">{order.problem_reason || 'Não especificado'}</span>
                             </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => onAction('negotiate')}
                                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-md hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                            >
                                <User size={14} />
                                Negociar Solução
                            </button>
                            <div className="h-6 w-px bg-amber-200 mx-1"></div>
                            <button
                                onClick={() => onAction('resume')}
                                className="px-3 py-2 bg-white text-blue-600 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                ↩️ Retomar
                            </button>
                            <button
                                onClick={() => onAction('cancel')}
                                className="px-3 py-2 bg-white text-red-600 text-xs font-bold rounded-md border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* QUEUE TAB: Report Problem Button */}
                {['pending', 'preparing', 'sent'].includes(order.status) && (
                     <div className="flex justify-end pt-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onAction('problem')}
                            className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md hover:bg-yellow-200 transition-colors flex items-center gap-1"
                        >
                            <AlertCircle size={14} />
                            Reportar Problema
                        </button>
                     </div>
                )}

                {/* HISTORY TAB: Cancellation Reason */}
                {order.status === 'canceled' && order.cancel_reason && (
                    <div className="mt-2 bg-red-100/50 p-2.5 rounded-md border border-red-100 text-xs flex gap-2 items-start text-red-800">
                         <span className="font-bold shrink-0">Motivo:</span>
                         <span>{order.cancel_reason}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
