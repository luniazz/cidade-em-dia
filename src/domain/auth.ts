/** Perfis de usuário reconhecidos pela autenticação local de demonstração. */
export type UserRole = "cidadao" | "atendente"

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  cidadao: "Cidadão",
  atendente: "Atendente",
}

/** Dados públicos do usuário autenticado. Nunca inclui a senha. */
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

/** Perfis autorizados a acessar a Área da Prefeitura. */
export const ADMIN_ROLES: readonly UserRole[] = ["atendente"]

export function isUserRole(value: unknown): value is UserRole {
  return value === "cidadao" || value === "atendente"
}

/**
 * Autorização: decide se o perfil do usuário pode acessar uma área. A
 * autenticação (existir um usuário logado) é verificada antes, por quem chama.
 */
export function hasAllowedRole(
  user: AuthUser,
  allowedRoles: readonly UserRole[],
): boolean {
  return allowedRoles.includes(user.role)
}

/** Resultado da proteção de uma rota para o usuário atual. */
export type RouteAccess = "allowed" | "login-required" | "forbidden"

/**
 * Decide o acesso a uma rota protegida: sem usuário exige login
 * (autenticação); usuário sem perfil permitido é barrado (autorização).
 *
 * É apenas controle de navegação da interface: a sessão fica no
 * `localStorage` e pode ser alterada pelo próprio usuário. Em produção, a
 * autorização real precisa ser feita pelo backend.
 */
export function resolveRouteAccess(
  user: AuthUser | null,
  allowedRoles?: readonly UserRole[],
): RouteAccess {
  if (!user) return "login-required"
  if (allowedRoles && !hasAllowedRole(user, allowedRoles)) return "forbidden"
  return "allowed"
}

const REDIRECT_BASE = "http://cidade-em-dia.invalid"

/**
 * Valida o destino pós-login: aceita somente caminhos internos da aplicação.
 * Rejeita URLs absolutas e formas que o navegador interpreta como outro
 * domínio, como `//site`, `/\site` ou com tabulação/quebra de linha no meio.
 */
export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("/")) return false
  if (value.startsWith("//") || value.includes("\\")) return false
  try {
    return new URL(value, REDIRECT_BASE).origin === REDIRECT_BASE
  } catch {
    return false
  }
}
