import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { flushSync } from "react-dom"
import type { AuthUser } from "../domain/auth"
import { authService } from "../services/authService"
import { startSessionSync } from "./sessionSync"

interface AuthContextValue {
  /** Usuário autenticado, ou `null` quando ninguém está logado. */
  user: AuthUser | null
  /** `false` enquanto a sessão salva está sendo lida ou revalidada. */
  ready: boolean
  login(email: string, password: string): Promise<AuthUser>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Mantém o usuário autenticado em um único lugar para toda a aplicação. Os
 * componentes leem a sessão por `useAuth()` e nunca acessam o armazenamento
 * diretamente.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  // Lê a sessão ao iniciar e a mantém alinhada com outras abas e com páginas
  // restauradas do bfcache. Enquanto `ready` é `false`, o `App` mostra apenas
  // o carregamento, sem conteúdo protegido nem o usuário antigo.
  useEffect(
    () =>
      startSessionSync(authService, window, {
        // `flushSync` aplica a ocultação antes de o navegador pintar a página
        // restaurada com o estado antigo.
        onRevalidating: () => flushSync(() => setReady(false)),
        onSessionResolved: (restored) => {
          setUser(restored)
          setReady(true)
        },
      }),
    [],
  )

  async function login(email: string, password: string) {
    const authenticated = await authService.login(email, password)
    setUser(authenticated)
    return authenticated
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.")
  }
  return context
}
