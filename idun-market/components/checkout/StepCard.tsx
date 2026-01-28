import React from 'react'
import { Check, Edit2 } from 'lucide-react'

interface StepCardProps {
    stepNumber: number
    title: string
    isActive: boolean
    isCompleted: boolean
    onEdit?: () => void
    children: React.ReactNode
    summary?: React.ReactNode
}

export function StepCard({ stepNumber, title, isActive, isCompleted, onEdit, children, summary }: StepCardProps) {
    return (
        <div 
            className={`
                bg-white md:rounded-xl md:shadow-sm md:border transition-colors duration-300 overflow-hidden
                ${isActive ? 'md:border-emerald-500 md:ring-1 md:ring-emerald-500 md:shadow-md' : 'md:border-gray-100'}
                border-b border-gray-100 md:border-b-0
            `}
        >
            {/* Header */}
            <div className={`p-4 md:p-6 flex items-center justify-between ${isActive ? 'bg-emerald-50/50' : 'bg-white'}`}>
                <div className="flex items-center gap-4">
                    <div 
                        className={`
                            w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-base md:text-lg transition-colors shrink-0
                            ${isCompleted ? 'bg-emerald-600 text-white' : isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}
                        `}
                    >
                        {isCompleted ? <Check size={20} /> : stepNumber}
                    </div>
                    <h2 className={`font-bold text-lg md:text-xl ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {title}
                    </h2>
                </div>

                {isCompleted && onEdit && (
                    <button 
                        onClick={onEdit}
                        className="text-emerald-600 font-medium text-sm hover:underline flex items-center gap-1"
                    >
                        <Edit2 size={14} />
                        Editar
                    </button>
                )}
            </div>

            {/* Content Body */}
            <div className={`transition-all duration-300 ease-in-out ${isActive ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 pt-0 border-t border-gray-100/50 mt-2">
                   {children}
                </div>
            </div>

            {/* Summary View (When Completed) */}
            {!isActive && isCompleted && summary && (
                 <div className="p-4 pt-0 pl-[4.25rem] text-sm text-gray-600">
                    {summary}
                 </div>
            )}
        </div>
    )
}
