import { useState } from "react"
import { AlertCircle, Truck, PackageCheck, X } from "lucide-react"

interface OrderActionModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'problem' | 'cancel' | 'resume'
    onSubmit: (status: string, reason?: string) => void
}

export function OrderActionModal({ isOpen, onClose, mode, onSubmit }: OrderActionModalProps) {
    const [reason, setReason] = useState("")

    if (!isOpen) return null

    const handleSubmit = () => {
        if ((mode === 'problem' || mode === 'cancel') && !reason.trim()) {
            return // Prevent submit without reason
        }
        
        if (mode === 'problem') onSubmit('problem', reason)
        if (mode === 'cancel') onSubmit('canceled', reason)
        // Resume is handled by specific buttons
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="font-bold text-lg text-gray-900">
                        {mode === 'problem' && 'Reportar Problema'}
                        {mode === 'cancel' && 'Cancelar Pedido'}
                        {mode === 'resume' && 'Retomar Pedido'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {mode === 'resume' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                className="h-24 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 transition-all group"
                                onClick={() => onSubmit('preparing')}
                            >
                                <PackageCheck size={32} className="text-blue-500 group-hover:text-blue-700 mb-1" />
                                <span className="font-bold text-sm">Voltar para Preparação 🍳</span>
                            </button>
                            <button 
                                className="h-24 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 transition-all group"
                                onClick={() => onSubmit('sent')}
                            >
                                <Truck size={32} className="text-indigo-500 group-hover:text-indigo-700 mb-1" />
                                <span className="font-bold text-sm">Voltar para Entrega 🛵</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-3 rounded-lg flex gap-3 text-sm ${mode === 'cancel' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                                <AlertCircle className="shrink-0" size={20} />
                                <p>
                                    {mode === 'problem' 
                                        ? 'Selecione o motivo ou descreva o problema:'
                                        : 'ATENÇÃO: Isso cancelará o pedido definitivamente e enviará uma mensagem no WhatsApp do cliente com o motivo.'}
                                </p>
                            </div>

                            {mode === 'problem' && (
                                <div className="flex flex-wrap gap-2">
                                    {["Cliente não atende", "Endereço não encontrado", "Falta de Ingrediente", "Motoboy caiu"].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setReason(r)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                                                reason === r
                                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-1 ring-yellow-300'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">
                                    {mode === 'problem' ? 'Detalhes do Problema' : 'Motivo (Obrigatório)'}
                                </label>
                                <textarea 
                                    placeholder={mode === 'problem' ? "Descreva o problema..." : "Ex: Falta de ingrediente, Fora da área de entrega..."}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full min-h-[100px] p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm resize-none placeholder-gray-500 text-gray-900"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {mode !== 'resume' && (
                    <div className="p-4 bg-gray-50 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={!reason.trim()}
                            className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                mode === 'cancel' 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                        >
                            Confirmar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
