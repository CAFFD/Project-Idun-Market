'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Loader2, Camera, X } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<{id: string, name: string}[]>([])
    
    // Form State
    const [name, setName] = useState('')
    const [price, setPrice] = useState('') // String for input handling
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        checkUser()
        fetchCategories()
    }, [])

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/login')
    }

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('id, name')
        if (data) setCategories(data)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Error uploading image: ', uploadError)
            alert('Erro ao fazer upload da imagem.')
            return null
        }

        const { data } = supabase.storage.from('products').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Pegar usuario atual para o store_id (Assumindo que o auth.uid() é o store_id conforme schema ou lógica de RLS)
            const { data: { user } } = await supabase.auth.getUser()
             
            if (!user) throw new Error('Usuário não logado')

            // Upload Image if exists
            let imageUrl = null
            if (imageFile) {
                imageUrl = await uploadImage(imageFile)
                if (!imageUrl) {
                    setLoading(false)
                    return
                }
            }

            const { error } = await supabase.from('products').insert({
                store_id: user.id, // Supondo 1 store por user e ID igual
                name,
                description,
                price: parseFloat(price.replace(',', '.')),
                category_id: categoryId || null,
                image_url: imageUrl,
                is_active: true
            })

            if (error) {
                console.error('Error inserting product:', error)
                alert('Erro ao salvar produto: ' + error.message)
            } else {
                router.push('/admin')
                router.refresh()
            }

        } catch (error) {
            console.error(error)
            alert('Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex items-center gap-4 bg-opacity-95 backdrop-blur-sm">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="font-bold text-gray-800 text-lg">Novo Produto</h1>
            </header>

            <main className="container mx-auto p-4 max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center justify-center">
                        <label 
                            className={`
                                relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
                                ${previewUrl ? 'border-emerald-500 bg-gray-900' : 'border-gray-300 bg-white hover:bg-gray-50'}
                            `}
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-medium">
                                        Trocar Imagem
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Camera className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm text-gray-500">Toque para adicionar foto</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                                placeholder="Ex: Coca-Cola 2L"
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white placeholder:text-slate-500"
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                                rows={3}
                                placeholder="Detalhes do produto..."
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Upload size={24} />
                                Cadastrar Produto
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    )
}
