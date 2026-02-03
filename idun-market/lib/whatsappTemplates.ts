export type WhatsappMessageType = 'created' | 'preparing' | 'sent' | 'canceled' | 'problem' | 'delivered';

export interface WhatsappMessageData {
    customerName: string;
    orderId: string;
    total?: number;
    deliveryTime?: number;
    addressStreet?: string;
    addressNumber?: string;
    reason?: string;
    storeName?: string;
}

// LOGISTICS EMOJI PACK (Unicode Hardened)
const Icons = {
  // 👋 Saudação (Mantém, é educado)
  wave: String.fromCodePoint(0x1F44B),

  // 🏪 Loja/Mercado (Em vez de caixa genérica)
  store: String.fromCodePoint(0x1F3EA),

  // 🛒 Carrinho de Compras (A alma do mercado)
  cart: String.fromCodePoint(0x1F6D2),

  // 📋 Prancheta/Checklist (Para "Em Separação" - muito mais logística que cozinhar)
  list: String.fromCodePoint(0x1F4CB),

  // 🚚 Caminhão de Entrega (Passa mais volume que a motinha)
  truck: String.fromCodePoint(0x1F69A),

  // 📦 Caixa/Pacote Fechado (Para pedido pronto)
  box: String.fromCodePoint(0x1F4E6),

  // 📍 Pin (Mantém)
  pin: String.fromCodePoint(0x1F4CD),

  // 💲 Cifrão (Pagamento)
  cash: String.fromCodePoint(0x1F4B2),
  
  // ⚠️ Aviso
  warning: String.fromCodePoint(0x26A0, 0xFE0F),

  // ⭐ Estrela
  star: String.fromCodePoint(0x2B50),

  // 💬 Chat
  chat: String.fromCodePoint(0x1F4AC),
};

export const getWhatsappMessage = (type: WhatsappMessageType, data: WhatsappMessageData): string => {
    const { customerName, orderId, total, deliveryTime = 40, addressStreet, addressNumber, reason, storeName = 'Idun Market' } = data;
    const shortId = orderId.slice(0, 8).toUpperCase();
    const formattedTotal = total ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total) : '';

    switch (type) {
        case 'created':
            return `Olá, *${customerName}*! ${Icons.wave}
Recebemos seu pedido no *${storeName}*!

${Icons.box} *Pedido:* #${shortId}
${Icons.cash} *Total:* ${formattedTotal}
${Icons.store} *Previsão:* ${deliveryTime} min

Já enviamos para a separação. Qualquer coisa, é só chamar aqui! ${Icons.cart}`;

        case 'preparing':
            return `${Icons.list} *Conferindo e Separando!*

Sua lista de compras do pedido *#${shortId}* já está com nossa equipe de separação.
Assim que sair para rota, avisamos!`;

        case 'sent':
            return `${Icons.truck} *Pedido em Rota!*

Suas compras do pedido *#${shortId}* já estão a caminho.
${Icons.pin} Endereço: ${addressStreet}, ${addressNumber || ''}

Fique de olho no interfone/celular!`;

        case 'canceled':
            return `${Icons.warning} *Poxa, tivemos um imprevisto...*

O pedido *#${shortId}* precisou ser cancelado/pausado.
${Icons.chat} Motivo: ${reason || 'Motivo não informado'}

Nossa equipe vai entrar em contato em instantes para resolver isso com você!`;
        
        case 'problem':
             return `${Icons.warning} *Olá ${customerName}*
             
Houve uma dúvida ou imprevisto com o pedido *#${shortId}*.
Poderia nos responder por aqui?`;

        case 'delivered':
             return `${Icons.star} *Pedido Entregue!*
             
O pedido *#${shortId}* foi entregue.
Muito obrigado pela preferência! ${Icons.store}`;

        default:
            return `Olá ${customerName}!`;
    }
};
