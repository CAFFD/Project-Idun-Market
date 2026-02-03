export interface Order {
    id: string
    created_at: string
    customer_name: string
    customer_phone: string
    customer_address?: string
    total_amount: number
    status: string
    order_items?: any[]
}
