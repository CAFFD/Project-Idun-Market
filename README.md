# 🛒 Projeto: Mercado SaaS via WhatsApp

## 📋 Visão Geral
Plataforma SaaS (Software as a Service) que permite a pequenos mercados de bairro criarem um catálogo online instantâneo. O foco é a simplicidade: o cliente monta o carrinho e o pedido é finalizado enviando uma mensagem formatada para o WhatsApp do lojista.

**Diferencial:** Não há processamento de pagamento online (reduzindo fricção e custos) e não há gestão de entregadores (responsabilidade do mercado).

## 🛠 Tech Stack
- **Front-end:** React / Next.js (Foco em PWA e Mobile First).
- **Back-end/BaaS:** Supabase (PostgreSQL, Auth, Storage, RLS).
- **Integração:** WhatsApp API (URL Scheme).
- **Hospedagem:** Vercel (Front) + Supabase (Dados).

## 📂 Estrutura da Documentação
- `01-STOREFRONT.md`: Backlog da interface do cliente final.
- `02-MERCHANT-PANEL.md`: Backlog do painel administrativo do lojista.
- `03-INFRASTRUCTURE.md`: Tarefas de infraestrutura e Super Admin.
- `04-DATABASE-SCHEMA.md`: Esquema do banco de dados (SQL).
