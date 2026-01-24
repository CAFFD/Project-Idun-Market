-- 1. ATUALIZA A TABELA EXISTENTE (Não destrói, apenas melhora)
-- Adiciona endereço e status que o código novo precisa
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_address text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Nota: Vamos manter 'total_amount' que você já tem. 
-- Se o código do agente usar 'total_value', avise ele ou altere no typescript para 'total_amount'.

-- 2. CRIA A TABELA DE ITENS (Que ainda não existe)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- 3. SEGURANÇA (RLS) - AQUI ESTÁ O SEGREDO DO SAAS

-- Habilita segurança
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política 1: Qualquer cliente (mesmo sem logar) pode criar os itens do pedido dele
CREATE POLICY "Clientes inserem itens" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- Política 2: APENAS O DONO DA LOJA certa pode ver os itens
-- (O script do agente deixava qualquer usuário logado ver tudo, o que é inseguro)
CREATE POLICY "Dono vê itens do pedido" 
ON public.order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE public.orders.id = public.order_items.order_id
        AND public.orders.store_id = auth.uid() -- O Pulo do Gato: só vê se for dono da loja
    )
);
