import { supabase } from './supabase'

export async function getStoreStatus(storeId?: string) {
    // Se não passar storeId, tenta pegar da sessão ou do primeiro que achar (para MVP single-tenant)
    // O ideal é passar o storeId do contexto.
    
    let query = supabase.from('stores').select('is_open, id')
    
    if (storeId) {
        query = query.eq('id', storeId)
    }

    const { data, error } = await query.single() // Pega apenas uma loja por enquanto
    
    if (error) {
        console.error('Erro ao buscar status da loja:', error)
        return { isOpen: false, storeId: null }
    }

    return { isOpen: data.is_open, storeId: data.id }
}

export async function updateStoreStatus(storeId: string, isOpen: boolean) {
    const { error } = await supabase
        .from('stores')
        .update({ is_open: isOpen })
        .eq('id', storeId)
    
    if (error) {
        throw error
    }
    return true
}
