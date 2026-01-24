import { supabase } from './supabase'
import { Product } from '@/store/useCart'

interface OrderData {
    customer_name: string
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

        return { orderId, error: null }

    } catch (error: any) {
        console.error('Erro ao processar pedido:', error)
        return { orderId: null, error: error.message || 'Erro desconhecido' }
    }
}
