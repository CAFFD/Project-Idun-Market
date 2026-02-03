'use client'

import React from 'react'
import { X, Phone, Clock, MapPin, CreditCard, User, CheckCircle2 } from 'lucide-react'
import { Order } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getWhatsappMessage, WhatsappMessageType } from '@/lib/whatsappTemplates'
import { openWhatsapp } from '@/lib/whatsapp'

interface OrderDetailsModalProps {
    order: Order | null
    onClose: () => void
    onStatusChange: (id: string, status: string) => void
}

const STATUS_LABELS: Record<string, string> = {
    'pending': 'Pendente',
    'preparing': 'Preparando',
    'sent': 'Enviado',
    'delivered': 'Entregue',
    'problem': 'Problema',
    'canceled': 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'preparing': 'bg-blue-100 text-blue-800',
    'sent': 'bg-indigo-100 text-indigo-800',
    'delivered': 'bg-green-100 text-green-800',
    'problem': 'bg-red-100 text-red-800',
    'canceled': 'bg-gray-100 text-gray-800',
}

export function OrderDetailsModal({ order, onClose, onStatusChange }: OrderDetailsModalProps) {
    if (!order) return null

    const timeElapsed = formatDistanceToNow(new Date(order.created_at), { locale: ptBR, addSuffix: false })
    const items = order.order_items || [] 

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                
                {/* Header Pattern */}
                <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-200/50 flex items-start justify-between p-4">
                    <div className="w-12" /> {/* Spacer */}
                    <button 
                        onClick={onClose}
                        className="p-1.5 bg-white/50 hover:bg-white text-gray-500 rounded-full transition-all shadow-sm backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 overflow-y-auto flex-1 -mt-8">
                    
                    {/* Title Section */}
                    <div className="flex flex-col items-center text-center space-y-2 mb-6">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                           <span className="text-2xl">📦</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(0, 4)}</h2>
                            <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 mt-1">
                                <Clock size={14} />
                                {timeElapsed} atrás
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-transparent ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                            {STATUS_LABELS[order.status] || order.status}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <User size={14} /> Cliente
                            </h3>
                            <div>
                                <p className="font-semibold text-gray-900 text-lg">{order.customer_name}</p>
                                <p className="text-gray-500 text-sm font-mono">{order.customer_phone || '-'}</p>
                            </div>
                            {order.customer_address && (
                                <div className="pt-3 border-t border-gray-200/50">
                                    <div className="flex gap-2">
                                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-gray-700 text-sm leading-relaxed">{order.customer_address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={14} /> Itens
                            </h3>
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                                {items.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {items.map((item: any, idx: number) => (
                                            <div key={idx} className="p-3 flex justify-between items-center bg-white"> 
                                                <div className="flex items-center gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center text-xs font-bold border border-gray-100">
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {item.product_name}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.unit_price || 0) * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-gray-400 text-sm">
                                        Sem itens.
                                    </div>
                                )}
                                <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">Total</span>
                                    <span className="text-lg font-bold text-emerald-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                    {/* WhatsApp */}
                    {order.customer_phone && (
                         <button
                            onClick={() => {
                                const msg = getWhatsappMessage(order.status as WhatsappMessageType, {
                                    customerName: order.customer_name,
                                    orderId: order.id,
                                    addressStreet: order.customer_address,
                                    reason: '',
                                    storeName: 'Idun Market'
                                })
                                openWhatsapp(order.customer_phone, msg)
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                            <Phone size={18} />
                            WhatsApp
                        </button>
                    )}

                    {/* Quick Status */}
                    <div className="grid grid-cols-2 gap-3">
                        {order.status === 'pending' && (
                            <button 
                                onClick={() => { onStatusChange(order.id, 'preparing'); onClose() }}
                                className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                            >
                                Iniciar Preparo
                            </button>
                        )}
                        {order.status === 'preparing' && (
                            <button 
                                onClick={() => { onStatusChange(order.id, 'sent'); onClose() }}
                                className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                            >
                                Enviar Pedido
                            </button>
                        )}
                         {order.status === 'sent' && (
                            <button 
                                onClick={() => { onStatusChange(order.id, 'delivered'); onClose() }}
                                className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                Concluir Entrega
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
