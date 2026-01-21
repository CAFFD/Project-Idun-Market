# 🏪 Módulo 2: Painel do Lojista (SaaS)

**Objetivo:** Permitir que o dono do mercado gerencie seu catálogo com o mínimo de esforço possível.

## Prioridades (MoSCoW)

### 🔴 Must Have (Obrigatório para MVP)
| ID | Tarefa | Descrição |
| :--- | :--- | :--- |
| **LJ-01** | **Autenticação** | Login seguro via Supabase Auth (Email/Senha). |
| **LJ-02** | **Perfil da Loja** | Editar Nome, Slug, WhatsApp, Logo e Endereço. |
| **LJ-03** | **CRUD Produtos** | Criar, Editar (Preço/Estoque) e Deletar produtos. |
| **LJ-04** | **Toggle Abrir/Fechar** | Botão global que altera o status `is_open` da loja instantaneamente. |

### 🟡 Should Have (Importante)
| ID | Tarefa | Descrição |
| :--- | :--- | :--- |
| **LJ-05** | **Importar Base Mestre** | Interface para selecionar produtos da tabela `master_products` e copiar para a loja. |
| **LJ-06** | **Configurar Entrega** | Campo de texto livre ou valor fixo para Taxa de Entrega. |

### 🟢 Could Have (Desejável)
| ID | Tarefa | Descrição |
| :--- | :--- | :--- |
| **LJ-07** | **Gerador de QR Code** | Botão que gera um PDF/Imagem com o QR Code da loja para impressão. |
| **LJ-08** | **Dashboard Simples** | Contador de "Cliques no Zap" do dia/mês. |

### ⚪ Won't Have (Fora do Escopo Atual)
- Gestão de estoque complexa (entrada de nota fiscal).
- Emissão de Nota Fiscal (NFe/NFCe).
- Integração com ERPs legados.
