export const openWhatsapp = (phone: string, text: string) => {
    // 1. Sanitize: Numbers only
    const cleanPhone = phone.replace(/\D/g, '')
    // Default to Brazil DDI (55) if missing
    // If the number is short (e.g. 11999999999), assume it needs 55. 
    // If it already has 12 or 13 digits starting with 55, keep it.
    const targetPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone

    // 2. Logging for Debug
    console.log('Sending WhatsApp:', { targetPhone, text })

    // 3. Encode
    // encodeURIComponent is robust for emojis if the source string is valid UTF-16/Unicode
    const encodedText = encodeURIComponent(text)

    // 4. Construct URL (Using API for robustness)
    const baseUrl = 'https://api.whatsapp.com/send' 

    const url = `${baseUrl}?phone=${targetPhone}&text=${encodedText}`
    
    // 5. Open
    window.open(url, '_blank')
}
