import type { AuthUser } from "../domain/auth"

/** Registro interno de usuário de demonstração, com a senha em texto puro. */
export interface DemoUserRecord extends AuthUser {
  password: string
}

/**
 * Usuários fixos da autenticação local de demonstração. Só o `authService`
 * deve ler este catálogo; as senhas nunca são gravadas no `localStorage`.
 * Será substituído por uma API real de autenticação no futuro.
 */
export const DEMO_USERS: readonly DemoUserRecord[] = [
  {
    id: "demo-cidadao",
    name: "João da Silva",
    email: "cidadao@cidadeemdia.com.br",
    password: "cidadao123",
    role: "cidadao",
  },
  {
    id: "demo-atendente",
    name: "Administrador",
    email: "admin@cidadeemdia.gov.br",
    password: "admin123",
    role: "atendente",
  },
]
