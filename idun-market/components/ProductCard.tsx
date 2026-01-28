'use client'

import React, { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { Product, useCart } from '@/store/useCart'

interface ProductCardProps {
    product: Product
    isStoreOpen?: boolean
}

export function ProductCard({ product, isStoreOpen = true }: ProductCardProps) {
    const { items, addItem, decreaseItem } = useCart()
    const [imageError, setImageError] = useState(false)

    const cartItem = items.find((item) => item.id === product.id)
    const quantity = cartItem?.quantity || 0

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(product.price)

    return (
        <div className="flex flex-row items-center p-4 bg-white gap-4 rounded-xl shadow-sm border border-gray-100 mb-4 hover:shadow-md hover:border-emerald-100 transition-all duration-200 cursor-pointer">
            {/* Image (Left) */}
            <div className="relative w-28 h-28 flex-shrink-0">
                {!imageError && product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover rounded-xl"
                        sizes="(max-width: 768px) 112px, 112px"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                        <ShoppingCart size={24} className="mb-1" />
                        <span className="text-[10px]">Sem foto</span>
                    </div>
                )}
            </div>

            {/* Content (Middle) */}
            {/* Content (Middle) */}
            <div className="flex-1 flex flex-col gap-1 self-start min-w-0 py-1">
                <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-tight">
                        {product.description}
                    </p>
                )}
                
                {/* Price Block */}
                <div className="block mt-auto pt-2 font-bold text-emerald-600">
                    {formattedPrice}
                </div>
            </div>

            {/* Controls (Right) */}
            <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0 self-center">
                {quantity === 0 ? (
                    <button
                        onClick={() => addItem(product)}
                        disabled={!isStoreOpen}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors text-white shadow-sm ${
                            !isStoreOpen 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        aria-label="Adicionar ao carrinho"
                    >
                        <Plus size={20} />
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                        <button
                            onClick={() => decreaseItem(product.id)}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                            aria-label="Remover um item"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="text-sm font-semibold w-4 text-center text-gray-900">
                            {quantity}
                        </span>
                        <button
                            onClick={() => addItem(product)}
                            className="p-1 rounded-full text-emerald-600 hover:bg-gray-200 transition-colors"
                            aria-label="Adicionar mais um"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
