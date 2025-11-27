import { api } from "./api";

export type AuthResponse = { token: string; email: string; roles: string[] };

export async function login(
  email: string,
  password: string,
  recaptchaToken: string
) {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
    recaptchaToken,
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("email", data.email);
  localStorage.setItem("roles", JSON.stringify(data.roles));
  return data;
}

export async function register(
  email: string,
  password: string,
  fullName?: string,
  recaptchaToken?: string
) {
  await api.post("/auth/register", {
    email,
    password,
    fullName,
    recaptchaToken,
  });
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("roles");
  
  sessionStorage.clear();
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.toLowerCase().includes("auth") || 
      key.toLowerCase().includes("token") || 
      key.toLowerCase().includes("user")
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function getRoles(): string[] {
  try {
    const raw = localStorage.getItem("roles");
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isAuthenticated() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; 
    if (Date.now() >= exp) {
      logout();
      return false;
    }
    return true;
  } catch {
    logout();
    return false;
  }
}
