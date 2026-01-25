'use client'

import React from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { Product, useCart } from '@/store/useCart'
import clsx from 'clsx'

interface ProductCardProps {
    product: Product
    isStoreOpen?: boolean
}

export function ProductCard({ product, isStoreOpen = true }: ProductCardProps) {
    const { items, addItem, decreaseItem } = useCart()

    const cartItem = items.find((item) => item.id === product.id)
    const quantity = cartItem?.quantity || 0

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(product.price)

    return (
        <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white h-full hover:shadow-md transition-shadow">
            {/* Image Area */}
            <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <ShoppingCart size={40} className="mb-2" />
                        <span className="text-sm">Sem imagem</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-800 text-lg line-clamp-2 mb-1">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-grow">
                        {product.description}
                    </p>
                )}
                
                <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="font-bold text-lg text-emerald-600">
                        {formattedPrice}
                    </span>

                    {/* Add to Cart Controls */}
                    {quantity === 0 ? (
                        <button
                            onClick={() => addItem(product)}
                            disabled={!isStoreOpen}
                            className={`p-2 rounded-full transition-colors text-white ${
                                !isStoreOpen 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                            aria-label="Adicionar ao carrinho"
                        >
                            <Plus size={20} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-1 py-1">
                            <button
                                onClick={() => decreaseItem(product.id)}
                                className="p-1 rounded-full bg-white text-gray-700 shadow-sm hover:text-emerald-600 disabled:opacity-50"
                                aria-label="Remover um item"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="text-sm font-semibold w-6 text-center text-gray-900">
                                {quantity}
                            </span>
                            <button
                                onClick={() => addItem(product)}
                                className="p-1 rounded-full bg-white text-gray-700 shadow-sm hover:text-emerald-600"
                                aria-label="Adicionar mais um"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
