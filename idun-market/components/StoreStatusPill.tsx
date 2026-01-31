import React from 'react'
import { Moon } from 'lucide-react'

export function StoreStatusPill() {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-xl flex items-center gap-4 border border-slate-700/50">
                <div className="relative">
                    <Moon size={20} className="text-emerald-400" fill="currentColor" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
                <div className="flex flex-col">
                     <span className="text-base font-bold leading-none">Loja Fechada</span>
                     <span className="text-xs text-slate-400 font-medium leading-tight mt-0.5">Aguarde a abertura</span>
                </div>
            </div>
        </div>
    )
}
