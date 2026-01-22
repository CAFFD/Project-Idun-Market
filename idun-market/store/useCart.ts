import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
    id: string
    name: string
    price: number
    image_url?: string | null
    description?: string | null
    category_id?: string | null
    [key: string]: any
}

interface CartItem extends Product {
    quantity: number
}

interface CartState {
    items: CartItem[]
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    decreaseItem: (productId: string) => void
    clearCart: () => void
    totalPrice: () => number
    totalItems: () => number
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const currentItems = get().items
                const existingItem = currentItems.find((item) => item.id === product.id)

                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    })
                } else {
                    set({ items: [...currentItems, { ...product, quantity: 1 }] })
                }
            },
            removeItem: (productId) => {
                set({ items: get().items.filter((item) => item.id !== productId) })
            },
            decreaseItem: (productId) => {
                const currentItems = get().items
                const existingItem = currentItems.find((item) => item.id === productId)

                if (existingItem && existingItem.quantity > 1) {
                    set({
                        items: currentItems.map((item) =>
                            item.id === productId
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        ),
                    })
                } else {
                    set({ items: currentItems.filter((item) => item.id !== productId) })
                }
            },
            clearCart: () => set({ items: [] }),
            totalPrice: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
            },
            totalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0)
            }
        }),
        {
            name: 'idun-cart',
        }
    )
)
