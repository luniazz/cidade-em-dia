import { Navigate, Outlet, useLocation } from "react-router"
import type { UserRole } from "../domain/auth"
import { resolveRouteAccess } from "../domain/auth"
import { useAuth } from "../context/AuthContext"

/** Estado de navegação lido pela tela de login para voltar à rota original. */
export interface LoginRedirectState {
  from?: string
}

/** Estado de navegação lido por "Meu perfil" para explicar um acesso negado. */
export interface AccessDeniedState {
  accessDenied?: boolean
}

interface RequireAuthProps {
  /** Quando informado, além de autenticado o usuário precisa ter um destes perfis. */
  allowedRoles?: readonly UserRole[]
}

/**
 * Proteção centralizada de rotas. Envolve rotas filhas no `App`:
 * - sem usuário (autenticação): redireciona para o login, guardando a rota original;
 * - usuário sem perfil permitido (autorização): redireciona para "Meu perfil"
 *   com um aviso de acesso restrito;
 * - caso contrário, renderiza a rota filha.
 */
export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user } = useAuth()
  const location = useLocation()
  const access = resolveRouteAccess(user, allowedRoles)

  if (access === "login-required") {
    const state: LoginRedirectState = {
      from: location.pathname + location.search,
    }
    return <Navigate to="/entrar" replace state={state} />
  }

  if (access === "forbidden") {
    const state: AccessDeniedState = { accessDenied: true }
    return <Navigate to="/perfil" replace state={state} />
  }

  return <Outlet />
}
