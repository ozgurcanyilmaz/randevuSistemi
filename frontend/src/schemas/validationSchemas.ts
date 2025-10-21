import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email adresi gereklidir')
    .email('Geçerli bir email adresi giriniz'),
  password: yup
    .string()
    .required('Şifre gereklidir')
    .min(5, 'Şifre en az 5 karakter olmalıdır')
})

export const registerSchema = yup.object({
  fullName: yup
    .string()
    .required('Ad Soyad gereklidir')
    .min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
  email: yup
    .string()
    .required('Email adresi gereklidir')
    .email('Geçerli bir email adresi giriniz'),
  password: yup
    .string()
    .required('Şifre gereklidir')
    .min(5, 'Şifre en az 5 karakter olmalıdır')
    .max(50, 'Şifre en fazla 50 karakter olabilir')
})

export type LoginFormData = yup.InferType<typeof loginSchema>
export type RegisterFormData = yup.InferType<typeof registerSchema>