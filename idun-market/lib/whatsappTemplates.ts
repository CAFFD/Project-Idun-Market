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

export const getWhatsappMessage = (type: WhatsappMessageType, data: WhatsappMessageData): string => {
    const { customerName, orderId, total, deliveryTime = 40, addressStreet, addressNumber, reason, storeName = 'Idun Market' } = data;
    const shortId = orderId.slice(0, 8).toUpperCase();
    const formattedTotal = total ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total) : '';

    switch (type) {
        case 'created':
            return `Olá, *${customerName}*! 👋
Recebemos seu pedido no *${storeName}*!

📦 *Pedido:* #${shortId}
💰 *Total:* ${formattedTotal}
🕒 *Previsão:* ${deliveryTime} min

Já enviamos para a cozinha/separação. Qualquer coisa, é só chamar aqui! 🚀`;

        case 'preparing':
            return `👩🍳 *Mãos à obra!*

Seu pedido *#${shortId}* já está sendo preparado com todo cuidado.
Assim que sair para entrega, eu te aviso!`;

        case 'sent':
            return `🛵 *Saiu para entrega!*

O motoboy já está a caminho com seu pedido *#${shortId}*.
📍 Endereço: ${addressStreet}, ${addressNumber || ''}

Fique de olho no interfone/celular! 😋`;

        case 'canceled':
            return `⚠️ *Poxa, tivemos um imprevisto...*

O pedido *#${shortId}* precisou ser cancelado/pausado.
💬 Motivo: ${reason || 'Motivo não informado'}

Nossa equipe vai entrar em contato em instantes para resolver isso com você!`;
        
        case 'problem':
             return `⚠️ *Olá ${customerName}*
             
Houve uma dúvida ou imprevisto com o pedido *#${shortId}*.
Poderia nos responder por aqui?`;

        case 'delivered':
             return `⭐ *Pedido Entregue!*
             
O pedido *#${shortId}* foi entregue.
Esperamos que goste! Bom apetite! 😋`;

        default:
            return `Olá ${customerName}!`;
    }
};
