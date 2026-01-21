# 📱 Módulo 1: Storefront (Cliente Final)

**Objetivo:** Maximizar a conversão (cliques no botão "Enviar Pedido") e garantir velocidade de carregamento.

## Prioridades (MoSCoW)

### 🔴 Must Have (Obrigatório para MVP)
| ID | Tarefa | Descrição |
| :--- | :--- | :--- |
| **ST-01** | **Rota Dinâmica da Loja** | Acessar via URL amigável (ex: `app.com/[slug-da-loja]`). |
| **ST-02** | **Navegação por Categoria** | Listar produtos filtrados por `category_id` (Hortifruti, Bebidas, etc). |
| **ST-03** | **Busca Instantânea** | Input de texto que filtra produtos pelo nome em tempo real. |
| **ST-04** | **Gerenciamento de Carrinho** | Adicionar/Remover itens, alterar quantidade e persistir no `localStorage`. |
| **ST-05** | **Seleção de Pagamento** | Select simples: Dinheiro (com campo de troco), Cartão (Débito/Crédito), Pix. |
| **ST-06** | **Checkout via WhatsApp** | Gerar string formatada com os itens + total e redirecionar para `wa.me/numero`. |

### 🟡 Should Have (Importante)
| ID | Tarefa | Descrição |
| :--- | :--- | :--- |
| **ST-07** | **Persistência de Dados** | Salvar Nome, Endereço e Tel do cliente no navegador para a próxima compra. |
| **ST-08** | **Status da Loja** | Bloquear checkout se o campo `is_open` da loja for `false`. |

### 🟢 Could Have (Desejável)
| ID | Tarefa | Descrição |
| :--- | :--- | :--- |
| **ST-09** | **PWA Install** | Manifesto e Service Workers para instalar na Home do celular. |
| **ST-10** | **Destaques** | Carrossel de produtos em promoção no topo da lista. |

### ⚪ Won't Have (Fora do Escopo Atual)
- Login de cliente (Compra deve ser "Guest Checkout").
- Pagamento online (Stripe/Mercado Pago).
- Rastreamento de entregador em tempo real.
