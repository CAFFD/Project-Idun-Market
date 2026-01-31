import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/ProductCard'
import { getStoreStatus } from '@/lib/storeService'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { FloatingCartBar } from '@/components/FloatingCartBar'
import { CartSheet } from '@/components/CartSheet'
import { StoreStatusPill } from '@/components/StoreStatusPill'
import { HeaderCartButton } from '@/components/HeaderCartButton'

// Fetch data on server
async function getProducts() {
    const { data } = await supabase.from('products').select('*').eq('is_active', true)
    return data || []
}

async function getCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    return data || []
}

export const revalidate = 0 // Disable cache for real-time-ish feel

export default async function Home() {
    const products = await getProducts()
    const categories = await getCategories()
    const { isOpen: isStoreOpen } = await getStoreStatus()

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            {/* Store Closed Banner */}
            {!isStoreOpen && <StoreStatusPill />}

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-emerald-700">Idun Market</h1>
                    <div className="relative">
                        <HeaderCartButton />
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 md:px-6 py-6">
                {/* Categories */}
                <section className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium whitespace-nowrap shadow-sm">
                        Todos
                    </button>
                    {categories.map((cat) => (
                        <button 
                            key={cat.id}
                            className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-50 hover:border-emerald-200 transition-colors"
                        >
                            {cat.name}
                        </button>
                    ))}
                  </div>
                </section>

                {/* Products Grid */}
                <section>
                    {products.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} isStoreOpen={isStoreOpen} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Floating Cart Footer */}
            <FloatingCartBar />
            <CartSheet />
        </main>
    )
}


