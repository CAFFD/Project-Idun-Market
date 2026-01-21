# 🗄️ Database Schema (Supabase/PostgreSQL)

Execute este script no SQL Editor do Supabase para criar a estrutura completa.

```sql
-- Extensões
create extension if not exists "uuid-ossp";

-- 1. Tabelas Principais
create table public.stores (
  id uuid references auth.users not null primary key,
  name text not null,
  slug text not null unique,
  whatsapp_number text not null,
  address text,
  logo_url text,
  is_open boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_active boolean default true,
  unit text default 'un',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.master_products (
  id uuid default uuid_generate_v4() primary key,
  ean text unique,
  name text not null,
  default_image_url text,
  suggested_category text
);

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  customer_name text not null,
  total_amount numeric(10,2) not null,
  items_json jsonb not null,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Row Level Security (RLS)
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.orders enable row level security;

-- Policies (Lojas)
create policy "Lojas públicas para leitura" on public.stores for select using (true);
create policy "Dono atualiza loja" on public.stores for update using (auth.uid() = id);

-- Policies (Produtos)
create policy "Produtos públicos" on public.products for select using (true);
create policy "Dono gerencia produtos" on public.products for all using (auth.uid() = store_id);

-- Policies (Pedidos)
create policy "Clientes criam pedidos" on public.orders for insert with check (true);
create policy "Dono vê pedidos" on public.orders for select using (auth.uid() = store_id);

-- 3. Trigger para Novos Usuários
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.stores (id, name, slug, whatsapp_number)
  values (new.id, new.raw_user_meta_data->>'store_name', new.raw_user_meta_data->>'slug', new.raw_user_meta_data->>'whatsapp');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
