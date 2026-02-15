'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/store/useCart'
import { createOrder } from '@/lib/orderService'
import { getStoreStatus } from '@/lib/storeService'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, User, Phone, CheckCircle2, Circle, Smartphone, CreditCard, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { StepCard } from '@/components/checkout/StepCard'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { toast } from 'sonner'
import { step1Schema, step2Schema, step3Schema, checkoutSchema, type CheckoutData } from '@/lib/schemas/checkout'
import { formatPhone, formatCEP } from '@/lib/utils'
import { getAddressByCEP } from '@/lib/cepService'
import { ZodError } from 'zod'
import { getWhatsappMessage } from '@/lib/whatsappTemplates'
import { openWhatsapp } from '@/lib/whatsapp'

export default function CheckoutPage() {
    // Global State
    const [currentStep, setCurrentStep] = useState(1)
    const { items, removeItem, totalPrice } = useCart()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState<CheckoutData>({
        name: '',
        phone: '',
        cep: '',
        address: '',
        number: '',
        complement: '',
        district: '',
        paymentMethod: 'Pix' // Default
    })

    // Validation Errors
    const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({})

    // Hydration & Persistence
    useEffect(() => {
        setMounted(true)
        const savedData = localStorage.getItem('checkout_data')
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData)
                setFormData(prev => ({ ...prev, ...parsed }))
            } catch (e) {
                console.error("Failed to parse saved checkout data", e)
            }
        }
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('checkout_data', JSON.stringify(formData))
        }
    }, [formData, mounted])

    // Empty State & Store Status Check
    useEffect(() => {
        async function validateCheckout() {
            if (!mounted) return

            // 1. Check Cart
            if (items.length === 0) {
                toast.info('Seu carrinho está vazio 🛒', {
                    description: 'Adicione itens antes de finalizar o pedido.',
                    duration: 4000,
                })
                router.push('/')
                return
            }

            // 2. Check Store Status
            try {
                const { isOpen } = await getStoreStatus()
                if (!isOpen) {
                    toast.error('Loja Fechada 🌙', {
                        description: 'Desculpe, a loja fechou enquanto você comprava.',
                        duration: 5000,
                    })
                    router.push('/')
                }
            } catch (error) {
                console.error('Error checking store status:', error)
            }
        }

        validateCheckout()
    }, [mounted, items, router])

    if (!mounted || items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Carregando...</p>
                </div>
            </div>
        )
    }

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        let formattedValue = value

        if (name === 'phone') formattedValue = formatPhone(value)
        if (name === 'cep') formattedValue = formatCEP(value)

        setFormData(prev => ({ ...prev, [name]: formattedValue }))
        
        // Clear error when user types
        if (errors[name as keyof CheckoutData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }))
        }
    }

    const handleBlurCEP = async () => {
        if (formData.cep.length === 9) {
            const data = await getAddressByCEP(formData.cep)
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    address: data.logradouro,
                    district: data.bairro,
                    complement: prev.complement || data.complemento // Keep existing if user typed
                }))
                toast.success('Endereço encontrado!')
            } else {
                toast.error('CEP não encontrado')
            }
        }
    }

    const validateStep = (step: number) => {
        try {
            if (step === 1) step1Schema.parse(formData)
            if (step === 2) step2Schema.parse(formData)
            if (step === 3) step3Schema.parse(formData)
            return true
        } catch (error) {
            if (error instanceof ZodError) {
                const newErrors: Partial<Record<keyof CheckoutData, string>> = {}
                error.issues.forEach((err) => {
                    const field = err.path[0] as keyof CheckoutData
                    if (field) {
                        newErrors[field] = err.message
                    }
                })
                setErrors(newErrors)
                
                 // Show first error toast
                 const firstError = Object.values(newErrors)[0]
                 if (firstError) toast.error(firstError)
            }
            return false
        }
    }

    const goToNextStep = (step: number) => {
        if (validateStep(step)) {
            setCurrentStep(step + 1)
        }
    }

    const handleCheckout = async () => {
        if (!validateStep(3)) return

        setLoading(true)

        try {
            // Final validation of everything
            checkoutSchema.parse(formData)

            const total = totalPrice()
            const fullAddress = `${formData.address}, ${formData.number} - ${formData.district} ${formData.complement ? `(${formData.complement})` : ''} - CEP: ${formData.cep}`
            const firstItemStoreId = items[0]?.store_id || null

            // 1. Save Order to Database
            const { orderId, whatsappNumber, error } = await createOrder({
                customer_name: formData.name,
                customer_phone: formData.phone,
                customer_address: fullAddress,
                payment_method: formData.paymentMethod,
                total_amount: total,
                store_id: firstItemStoreId
            }, items)

            if (error) throw new Error(error)

            // 2. WhatsApp Message
            const message = getWhatsappMessage('created', {
                customerName: formData.name,
                orderId: orderId || '000',
                total: total + 5.90,
                deliveryTime: 40, 
                storeName: 'Idun Market'
            })

            const targetNumber = whatsappNumber || '5511999999999'
            openWhatsapp(targetNumber, message)

            // 3. Clear & Redirect
            localStorage.removeItem('checkout_data') // Clear saved form
            items.forEach(item => removeItem(item.id))

            router.push('/')

        } catch (err: any) {
            console.error('🚨 ERRO CRÍTICO NO CHECKOUT:', err)
            
            // Log deep details for Vercel Logs
            if (err.message) console.error('Erro Message:', err.message)
            if (err.details) console.error('Erro Details:', err.details)
            if (err.hint) console.error('Erro Hint:', err.hint)
            if (err.code) console.error('Erro Code (Postgres):', err.code)

            toast.error('Erro ao processar pedido. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 lg:pb-0">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4 shadow-sm mb-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8 flex items-center gap-4">
                    <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Finalizar Pedido</h1>
                </div>
            </header>

            <main className="container mx-auto max-w-5xl px-4 lg:px-8">
                {/* Mobile Top Summary */}
                <div className="lg:hidden mb-6">
                    <OrderSummary 
                        onCheckout={handleCheckout} 
                        loading={loading}
                        canCheckout={currentStep === 3}
                        hideButton={true}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Steps */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        {/* Step 1: Identification */}
                        <StepCard
                            stepNumber={1}
                            title="Identificação"
                            isActive={currentStep === 1}
                            isCompleted={currentStep > 1}
                            onEdit={() => setCurrentStep(1)}
                            summary={
                                <div className="flex flex-col gap-1 text-base">
                                    <p className="font-medium text-gray-900">{formData.name}</p>
                                    <p className="text-sm text-gray-500">{formData.phone}</p>
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <User size={16} /> Nome Completo
                                    </label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Como você se chama?"
                                        className={`w-full rounded-lg border bg-gray-50 px-4 h-11 md:h-12 text-base outline-none transition-all
                                            ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}
                                        `}
                                    />
                                    {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Phone size={16} /> Celular / WhatsApp
                                    </label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                        className={`w-full rounded-lg border bg-gray-50 px-4 h-11 md:h-12 text-base outline-none transition-all
                                            ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}
                                        `}
                                    />
                                    {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone}</span>}
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={() => goToNextStep(1)}
                                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-[0.98] text-base"
                                >
                                    Ir para Entrega
                                </button>
                            </div>
                        </StepCard>

                        {/* Step 2: Address */}
                        <StepCard
                            stepNumber={2}
                            title="Endereço de Entrega"
                            isActive={currentStep === 2}
                            isCompleted={currentStep > 2}
                            onEdit={() => setCurrentStep(2)}
                             summary={
                                <div className="flex flex-col gap-1 text-base">
                                    <p>{formData.address}, {formData.number} - {formData.district}</p>
                                    <p className="text-sm text-gray-500">CEP: {formData.cep}</p>
                                </div>
                            }
                        >
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                    <input
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        onBlur={handleBlurCEP}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className={`w-full rounded-lg border bg-gray-50 px-4 h-11 md:h-12 text-base outline-none transition-all
                                            ${errors.cep ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}
                                        `}
                                    />
                                    {errors.cep && <span className="text-red-500 text-xs mt-1">{errors.cep}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                    <input
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        placeholder="Seu bairro"
                                        className={`w-full rounded-lg border bg-gray-50 px-4 h-11 md:h-12 text-base outline-none transition-all
                                            ${errors.district ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}
                                        `}
                                    />
                                     {errors.district && <span className="text-red-500 text-xs mt-1">{errors.district}</span>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <MapPin size={16} /> Endereço (Rua/Av)
                                    </label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Nome da rua"
                                        className={`w-full rounded-lg border bg-gray-50 px-4 h-11 md:h-12 text-base outline-none transition-all
                                            ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}
                                        `}
                                    />
                                    {errors.address && <span className="text-red-500 text-xs mt-1">{errors.address}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                    <input
                                        name="number"
                                        value={formData.number}
                                        onChange={handleInputChange}
                                        placeholder="123"
                                        className={`w-full rounded-lg border bg-gray-50 px-4 h-11 md:h-12 text-base outline-none transition-all
                                            ${errors.number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}
                                        `}
                                    />
                                    {errors.number && <span className="text-red-500 text-xs mt-1">{errors.number}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Complemento (Opcional)</label>
                                    <input
                                        name="complement"
                                        value={formData.complement}
                                        onChange={handleInputChange}
                                        placeholder="Ap 101"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-11 md:h-12 text-base text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                            </div>

                             <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={() => goToNextStep(2)}
                                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-[0.98] text-base"
                                >
                                    Ir para Pagamento
                                </button>
                            </div>
                        </StepCard>

                        {/* Step 3: Payment */}
                        <StepCard
                            stepNumber={3}
                            title="Pagamento"
                            isActive={currentStep === 3}
                            isCompleted={false}
                            summary={null}
                        >
                             <div className="space-y-4">
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm mb-6 border border-blue-100">
                                    <div className="mt-0.5"><Circle size={16} fill="currentColor" className="text-blue-500" /></div>
                                    <div>
                                        <p className="font-bold mb-1">Pagamento apenas na entrega</p>
                                        <p>Não se preocupe! O pagamento é realizado apenas no momento da entrega.</p>
                                    </div>
                                </div>

                                <label 
                                    className={`
                                        flex items-center justify-between p-4 md:p-6 rounded-xl border-2 cursor-pointer transition-all
                                        ${formData.paymentMethod === 'Pix' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}
                                    `}
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Pix' }))}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                                            <Smartphone size={28} />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-900 text-lg">Pix (Pagar na Entrega)</span>
                                            <span className="text-base text-emerald-600 font-medium">Pagamento instantâneo</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'Pix' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                        {formData.paymentMethod === 'Pix' && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
                                    </div>
                                </label>

                                <label 
                                    className={`
                                        flex items-center justify-between p-4 md:p-6 rounded-xl border-2 cursor-pointer transition-all
                                        ${formData.paymentMethod === 'Cartão' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}
                                    `}
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Cartão' }))}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                            <CreditCard size={28} />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-900 text-lg">Cartão (Pagar na Entrega)</span>
                                            <span className="text-base text-gray-500">Levamos a maquininha</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'Cartão' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                        {formData.paymentMethod === 'Cartão' && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
                                    </div>
                                </label>
                             </div>
                        </StepCard>

                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="hidden lg:block lg:col-span-4">
                        <OrderSummary 
                            onCheckout={handleCheckout} 
                            loading={loading}
                            canCheckout={currentStep === 3}
                        />
                    </div>
                    
                </div>
            </main>

            {/* Mobile Footer Fixed */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
                    <div className="flex flex-col">
                         <span className="text-sm text-gray-500">Total a pagar</span>
                         <span className="text-2xl font-extrabold text-emerald-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice() + 5.90)}
                         </span>
                    </div>
                    <button 
                        onClick={handleCheckout}
                        disabled={loading || currentStep !== 3}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed h-12 flex items-center justify-center"
                    >
                         {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Pedido'}
                    </button>
                </div>
            </div>
        </div>
    )
}
