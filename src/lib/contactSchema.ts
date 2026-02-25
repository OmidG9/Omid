import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .max(60, 'نام نباید بیشتر از ۶۰ کاراکتر باشد'),
  email: z.string().email('آدرس ایمیل معتبر نیست'),
  message: z
    .string()
    .min(10, 'پیام باید حداقل ۱۰ کاراکتر باشد')
    .max(2000, 'پیام نباید بیشتر از ۲۰۰۰ کاراکتر باشد'),
  /** Honeypot – bots fill this, humans leave it empty */
  company: z.string().max(0, '').optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
