import { z } from 'zod';

export const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
export const cepRegex = /^\d{5}-\d{3}$/;

export const step1Schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().regex(phoneRegex, 'Telefone inválido. Formato: (99) 99999-9999')
});

export const step2Schema = z.object({
  cep: z.string().regex(cepRegex, 'CEP inválido. Formato: 99999-999'),
  address: z.string().min(3, 'Endereço obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  district: z.string().min(2, 'Bairro obrigatório')
});

export const step3Schema = z.object({
  paymentMethod: z.enum(['Pix', 'Cartão', 'Dinheiro'], {
    invalid_type_error: 'Selecione uma forma de pagamento válida'
  })
});

export const checkoutSchema = step1Schema.merge(step2Schema).merge(step3Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type CheckoutData = z.infer<typeof checkoutSchema>;
