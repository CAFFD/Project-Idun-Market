'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Package, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/store/useCart'

export default function AdminPage() {
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
                <h1 className="font-bold text-gray-800 text-lg">Meus Produtos</h1>
                <button 
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-red-600 transition-colors p-2"
                >
                    <LogOut size={20} />
                </button>
            </header>

            <main className="container mx-auto p-4 max-w-2xl">
                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                        <Package size={48} className="mb-4 text-gray-300" />
                        <p>Nenhum produto cadastrado.</p>
                        <p className="text-sm">Clique no + para adicionar.</p>
                    </div>
                ) : (
                <>
                {/* Mobile View: Cards */}
                <div className="block md:hidden space-y-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4 border border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-800 truncate">{product.name}</h3>
                                <p className="text-sm text-emerald-600 font-semibold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link 
                                    href={`/admin/products/${product.id}`}
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    <Edit size={20} />
                                </Link>
                                <button 
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 w-24">Imagem</th>
                                <th className="p-4 font-semibold text-gray-600">Produto</th>
                                <th className="p-4 font-semibold text-gray-600 w-32">Preço</th>
                                <th className="p-4 font-semibold text-gray-600 w-24 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">--</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="p-4 text-emerald-600 font-medium">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link 
                                                href={`/admin/products/${product.id}`}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </>
                )}
            </main>

            {/* FAB - Floating Action Button */}
            <Link
                href="/admin/products/new"
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center z-50"
            >
                <Plus size={24} />
            </Link>
        </div>
    )
}
