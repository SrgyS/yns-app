import { z } from 'zod'

export const emailSignInSchema = z.object({
  email: z
    .string()
    .min(3, 'Email обязателен')
    .email('Введите корректный email'),
  password: z.string().min(2, 'Пароль обязателен'),
})

export const emailSignUpSchema = z.object({
  email: z
    .string()
    .min(3, 'Email обязателен')
    .email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  name: z.string().min(2, 'Минимум 2 символа'),
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(3, 'Email обязателен')
    .email('Введите корректный email'),
})

export const newPasswordSchema = z.object({
  password: z.string().min(6, 'Минимум 6 символов'),
})

export const newPasswordSchemaWithToken = z.object({
  password: z.string().min(6, 'Минимум 6 символов'),
  token: z.string(),
})
