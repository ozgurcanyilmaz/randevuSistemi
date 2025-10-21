import { api } from './api'

export type AuthResponse = { token: string; email: string; roles: string[] }

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  localStorage.setItem('token', data.token)
  localStorage.setItem('email', data.email)
  localStorage.setItem('roles', JSON.stringify(data.roles))
  return data
}

export async function register(email: string, password: string, fullName?: string) {
  await api.post('/auth/register', { email, password, fullName })
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('email')
  localStorage.removeItem('roles')
}

export function getRoles(): string[] {
  try {
    const raw = localStorage.getItem('roles')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('token')
}





















