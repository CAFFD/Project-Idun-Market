import { supabase } from './supabase'
import { Product } from '@/store/useCart'

interface OrderData {
    customer_name: string
    customer_phone: string
    customer_address: string
    payment_method: string
    total_amount: number
    store_id?: string
}

interface OrderItem {
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
}

export async function createOrder(orderData: OrderData, items: { id: string, name: string, quantity: number, price: number }[]) {
    try {
        // 1. Criar o Pedido
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                customer_address: orderData.customer_address,
                payment_method: orderData.payment_method,
                total_amount: orderData.total_amount,
                store_id: orderData.store_id, // Passando o store_id se existir
                status: 'pending'
            })
            .select()
            .single()

        if (orderError) throw orderError
        if (!order) throw new Error('Falha ao criar pedido')

        // 2. Preparar Itens do Pedido
        const orderId = order.id
        const orderItems = items.map(item => ({
            order_id: orderId,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
        }))

        // 3. Inserir Itens
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) throw itemsError

        // 4. Buscar WhatsApp da Loja (Se tiver store_id)
        let whatsappNumber = null
        if (orderData.store_id) {
            const { data: store } = await supabase
                .from('stores')
                .select('whatsapp_number')
                .eq('id', orderData.store_id)
                .single()
            
            if (store) whatsappNumber = store.whatsapp_number
        }

        return { orderId, whatsappNumber, error: null }

    } catch (error: any) {
        console.error('Erro ao processar pedido:', error)
        return { orderId: null, whatsappNumber: null, error: error.message || 'Erro desconhecido' }
    }
}

export async function getOrders(options: { scope: 'active' | 'history', limit?: number } = { scope: 'active' }) {
    let query = supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                product_name,
                quantity,
                unit_price,
                total_price
            )
        `)
        .order('created_at', { ascending: false })

    if (options.scope === 'active') {
        // Pending, Preparing, Sent, Problem
        query = query.in('status', ['pending', 'preparing', 'sent', 'problem'])
    } else if (options.scope === 'history') {
        // Delivered, Canceled
        query = query.in('status', ['delivered', 'canceled'])
        if (options.limit) {
            query = query.limit(options.limit)
        }
    }

    const { data, error } = await query
    if (error) throw error
    return data
}

export async function updateOrderStatus(orderId: string, status: string, reason?: string) {
    const updateData: any = { status }
    
    // Hygiene: Clear problem_reason if we are resolving the problem (status is NOT problem)
    if (status !== 'problem') {
        updateData.problem_reason = null
    } else if (status === 'problem' && reason) {
        updateData.problem_reason = reason
    }

    if (status === 'canceled' && reason) {
        updateData.cancel_reason = reason
    }

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
    
    if (error) throw error
    return true
}
