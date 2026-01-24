'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Package, Trash2, Edit, Search } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/store/useCart'

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        fetchProducts()
    }

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                setProducts(data)
            }
        } catch (error) {
            console.error('Erro ao buscar produtos', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return

        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) {
            setProducts(products.filter(p => p.id !== id))
        } else {
            alert('Erro ao excluir produto')
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
                <h1 className="font-bold text-gray-800 text-lg">Gerenciar Produtos</h1>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={handleSignOut}
                        className="text-gray-500 hover:text-red-600 transition-colors p-2"
                        title="Sair"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="container mx-auto p-4 max-w-7xl">
                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                        <Package size={48} className="mb-4 text-gray-300" />
                        <p>Nenhum produto cadastrado.</p>
                        <p className="text-sm">Clique no + para adicionar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                {/* Imagem */}
                                <div className="aspect-square bg-gray-100 relative">
                                    {product.image_url ? (
                                        <img 
                                            src={product.image_url} 
                                            alt={product.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            Sem foto
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo */}
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="font-bold text-gray-800 truncate mb-1" title={product.name}>
                                        {product.name}
                                    </h3>
                                    
                                    <p className="text-emerald-600 font-bold text-lg mb-4">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                    </p>

                                    {/* Ações (Rodapé do Card) */}
                                    <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-100">
                                        <Link 
                                            href={`/admin/products/${product.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit size={16} />
                                            Editar
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(product.id)}
                                            className="flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FAB - Floating Action Button */}
            <Link
                href="/admin/products/new"
                className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center z-50"
            >
                <Plus size={24} />
            </Link>
        </div>
    )
}
