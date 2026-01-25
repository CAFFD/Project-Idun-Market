'use client'

import { useState } from 'react'
import { updateStoreStatus } from '@/lib/storeService'
import { toast } from 'sonner'
import { Store, Lock, Unlock, Loader2 } from 'lucide-react'

interface StoreStatusToggleProps {
    initialStatus: boolean
    storeId: string
}

export function StoreStatusToggle({ initialStatus, storeId }: StoreStatusToggleProps) {
    const [isOpen, setIsOpen] = useState(initialStatus)
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        const newState = !isOpen
        try {
            await updateStoreStatus(storeId, newState)
            setIsOpen(newState)
            if (newState) {
                toast.success('Loja ABERTA com sucesso! Clientes podem comprar.')
            } else {
                toast.success('Loja FECHADA. Compras bloqueadas.')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao atualizar status da loja.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className={`p-2 rounded-full ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Store size={20} />
            </div>
            
            <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Status da Loja</span>
                <span className={`font-bold ${isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isOpen ? 'ABERTA' : 'FECHADA'}
                </span>
            </div>

            <button
                onClick={handleToggle}
                disabled={loading}
                className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    isOpen ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`${
                        isOpen ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                />
            </button>
            {loading && <Loader2 className="animate-spin text-gray-400" size={16} />}
        </div>
    )
}
