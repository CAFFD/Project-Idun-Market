'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Camera, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

    // Form State
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        // Validação simples de UUID para evitar erro 22P02 do Postgres
        const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)
        
        if (id && isValidUUID) {
            checkUserAndLoadData()
        } else if (id) {
            console.error("ID Inválido na URL:", id)
            alert("ID do produto inválido.")
            router.push('/admin')
        }
    }, [id])

    const checkUserAndLoadData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        await Promise.all([fetchCategories(), fetchProduct()])
    }

    const fetchCategories = async () => {
        const { data, error } = await supabase.from('categories').select('id, name')
        if (error) console.error("Erro categorias:", error)
        if (data) setCategories(data)
    }

    const fetchProduct = async () => {
        try {
            console.log("Buscando produto ID:", id)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Erro Supabase:', error)
                throw error
            }

            if (data) {
                console.log("Produto carregado:", data)
                setName(data.name)
                setPrice(data.price.toString())
                setDescription(data.description || '')
                setCategoryId(data.category_id || '')
                setCurrentImageUrl(data.image_url)
                if (data.image_url) {
                    setPreviewUrl(data.image_url)
                }
            }
        } catch (error) {
            console.error('Erro no fetchProduct:', error)
            alert('Erro ao carregar produto. Verifique o Console (F12).')
            // router.push('/admin') // Comentei para você ver o erro na tela se acontecer
        } finally {
            setFetching(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            // Remove caracteres especiais do nome do arquivo
            const fileExt = file.name.split('.').pop()
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '')
            const fileName = `${Date.now()}_${cleanFileName}.${fileExt}`
            
            console.log("Iniciando upload:", fileName)

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, file)

            if (uploadError) {
                console.error("Erro no Upload Supabase:", uploadError)
                throw uploadError
            }

            const { data } = supabase.storage.from('products').getPublicUrl(fileName)
            return data.publicUrl
        } catch (error) {
            console.error('Catch Upload:', error)
            alert('Erro ao fazer upload da imagem.')
            return null
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let finalImageUrl = currentImageUrl

            // Lógica de Imagem: Se tem arquivo novo, faz upload
            if (imageFile) {
                const newUrl = await uploadImage(imageFile)
                if (newUrl) {
                    finalImageUrl = newUrl
                } else {
                    setLoading(false)
                    return
                }
            }

            // Tratamento de segurança para o Preço (evita NaN)
            const parsedPrice = parseFloat(price.replace(',', '.'))
            if (isNaN(parsedPrice)) {
                alert("Preço inválido")
                setLoading(false)
                return
            }

            console.log("Enviando Update para o ID:", id)

            const { error } = await supabase
                .from('products')
                .update({
                    name,
                    description,
                    price: parsedPrice,
                    category_id: categoryId === '' ? null : categoryId, // Envia null se vazio
                    image_url: finalImageUrl,
                })
                .eq('id', id)

            if (error) {
                console.error("Erro no Update:", error)
                throw error
            }

            alert("Produto atualizado com sucesso!")
            router.push('/admin')
            router.refresh()

        } catch (error: any) {
            console.error('Erro Fatal no Submit:', error)
            alert('Erro ao atualizar: ' + (error.message || 'Erro desconhecido'))
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-emerald-600 mb-2" size={32} />
                <p className="text-gray-500">Carregando produto...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex items-center gap-4 bg-opacity-95 backdrop-blur-sm">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="font-bold text-gray-800 text-lg">Editar Produto</h1>
            </header>

            <main className="container mx-auto p-4 max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Area */}
                    <div className="flex flex-col items-center justify-center">
                        <label 
                            className={`
                                relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
                                ${previewUrl ? 'border-emerald-500 bg-gray-900' : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-emerald-400'}
                            `}
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                                        <Camera size={32} className="mb-2" />
                                        <span>Alterar Foto</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Camera className="text-gray-400 mb-2 group-hover:text-emerald-500 transition-colors" size={32} />
                                    <span className="text-sm text-gray-500 group-hover:text-emerald-600 transition-colors">Toque para adicionar foto</span>
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

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                                placeholder="Nome do produto"
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-shadow"
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                                rows={3}
                                placeholder="Descrição detalhada (opcional)"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={24} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}