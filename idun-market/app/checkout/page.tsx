'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/store/useCart'
import { createOrder } from '@/lib/orderService'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, User, Phone, CheckCircle2, Circle, Smartphone, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { StepCard } from '@/components/checkout/StepCard'
import { OrderSummary } from '@/components/checkout/OrderSummary'

// Icons mapping for payment methods
const PaymentIcons = {
    Pix: CheckCircle2, // Just a placeholder, ideally a QrCode icon or specific Pix SVG
    Card: CreditCard,
    Money: CheckCircle2
}

export default function CheckoutPage() {
    // Global State
    const [currentStep, setCurrentStep] = useState(1)
    const { items, removeItem, totalPrice } = useCart()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        cep: '',
        address: '',
        number: '',
        complement: '',
        district: '',
        paymentMethod: 'Pix'
    })

    // Hydration fix
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Empty State
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu carrinho está vazio 😢</h2>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                    <ArrowLeft size={20} />
                    Voltar as compras
                </Link>
            </div>
        )
    }

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const validateStep1 = () => {
        // Basic validation
        return formData.name && formData.phone && formData.address && formData.number && formData.district
    }

    const handleContinueToPayment = () => {
        if (!validateStep1()) {
            alert('Por favor, preencha todos os campos obrigatórios.')
            return
        }
        setCurrentStep(2)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCheckout = async () => {
        setLoading(true)

        try {
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
            const itemsList = items
                .map((item) => `- ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`)
                .join('\n')

            const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total + 5.90) // Adding delivery fee assumption

            const message = `*NOVO PEDIDO #${orderId?.slice(0, 8).toUpperCase()}*
            
Cliente: *${formData.name}*
Contato: ${formData.phone}
Endereço: ${fullAddress}
Pagamento: ${formData.paymentMethod}

*Itens:*
${itemsList}
*Taxa de entrega: R$ 5,90*

*Total: ${totalFormatted}*`

            const encodedMessage = encodeURIComponent(message)
            const targetNumber = whatsappNumber || '5511999999999'
            const url = `https://wa.me/${targetNumber}?text=${encodedMessage}`

            // 3. Clear & Redirect
            items.forEach(item => removeItem(item.id))
            window.open(url, '_blank')
            router.push('/')

        } catch (err) {
            console.error(err)
            alert('Erro ao processar pedido. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4 shadow-sm mb-8">
                <div className="container mx-auto max-w-6xl flex items-center gap-4">
                    <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Finalizar Pedido</h1>
                </div>
            </header>

            <main className="container mx-auto max-w-6xl px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Steps */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        {/* Step 1: Identification & Address */}
                        <StepCard
                            stepNumber={1}
                            title="Identificação e Entrega"
                            isActive={currentStep === 1}
                            isCompleted={currentStep > 1}
                            onEdit={() => setCurrentStep(1)}
                            summary={
                                <div className="flex flex-col gap-1 text-base">
                                    <p className="font-medium text-gray-900">{formData.name}</p>
                                    <p>{formData.address}, {formData.number} - {formData.district}</p>
                                    <p className="text-sm text-gray-500">{formData.phone}</p>
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <User size={18} /> Nome Completo
                                    </label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Como você se chama?"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone size={18} /> Celular / WhatsApp
                                    </label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="(00) 00000-0000"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>

                                <div className="md:col-span-2 border-t border-gray-100 my-2 pt-4">
                                    <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin size={20} className="text-emerald-600"/> Endereço de Entrega
                                    </h4>
                                </div>

                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">CEP</label>
                                    <input
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        placeholder="00000-000"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">Bairro</label>
                                    <input
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        placeholder="Seu bairro"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-base font-medium text-gray-700 mb-2">Endereço (Rua/Av)</label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Nome da rua"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">Número</label>
                                    <input
                                        name="number"
                                        value={formData.number}
                                        onChange={handleInputChange}
                                        placeholder="123"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base placeholder:text-gray-500 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">Complemento (Opcional)</label>
                                    <input
                                        name="complement"
                                        value={formData.complement}
                                        onChange={handleInputChange}
                                        placeholder="Ap 101, Bloco C"
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 h-12 text-base focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={handleContinueToPayment}
                                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all active:scale-[0.98] text-lg"
                                >
                                    Ir para o Pagamento
                                </button>
                            </div>
                        </StepCard>

                        {/* Step 2: Payment */}
                        <StepCard
                            stepNumber={2}
                            title="Pagamento"
                            isActive={currentStep === 2}
                            isCompleted={false}
                            summary={null}
                        >
                             <div className="space-y-4">
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm mb-6 border border-blue-100">
                                    <div className="mt-0.5"><Circle size={16} fill="currentColor" className="text-blue-500" /></div>
                                    <div>
                                        <p className="font-bold mb-1">Pagamento apenas na entrega</p>
                                        <p>Não se preocupe! O pagamento é realizado apenas no momento da entrega. Você não será cobrado agora.</p>
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
                                            <span className="text-base text-emerald-600 font-medium">Pagamento instantâneo ao receber</span>
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
                                            <span className="text-base text-gray-500">Crédito ou Débito na maquininha</span>
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
                    <div className="lg:col-span-4">
                        <OrderSummary 
                            onCheckout={handleCheckout} 
                            loading={loading}
                            canCheckout={currentStep === 2}
                        />
                    </div>
                    
                </div>
            </main>
        </div>
    )
}
