import type { AuthUser } from "../domain/auth"
import type { DemoUserRecord } from "../data/demoUsers"
import { DEMO_USERS } from "../data/demoUsers"

/**
 * Autenticação local de demonstração. Os componentes não devem acessar o
 * `localStorage` para autenticação: login, restauração da sessão e logout
 * passam por aqui.
 *
 * A sessão persistida guarda somente o `id` do usuário — nunca a senha nem o
 * perfil —, e o perfil é sempre resolvido a partir do catálogo de usuários.
 * A API é assíncrona para que a troca futura por uma API HTTP real não exija
 * reescrever o `AuthProvider`.
 */

const SESSION_STORAGE_KEY = "cidade-em-dia:session:v1"

/** Superfície mínima de armazenamento exigida pelo serviço, injetável em testes. */
export interface SessionStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type AuthServiceErrorCode = "invalid-credentials" | "storage-unavailable"

export class AuthServiceError extends Error {
  readonly code: AuthServiceErrorCode

  constructor(code: AuthServiceErrorCode, message: string) {
    super(message)
    this.name = "AuthServiceError"
    this.code = code
  }
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthUser>
  getCurrentUser(): Promise<AuthUser | null>
  logout(): Promise<void>
  /**
   * Avisa quando a sessão salva é alterada por outra aba (evento `storage`).
   * Retorna a função que remove o listener.
   */
  onSessionChange(listener: () => void): () => void
}

/** Alvo do evento `storage` (`window` na aplicação), injetável em testes. */
export interface StorageEventTargetLike {
  addEventListener(type: "storage", listener: (event: Event) => void): void
  removeEventListener(type: "storage", listener: (event: Event) => void): void
}

export interface AuthServiceDeps {
  storage: SessionStorageLike
  storageEvents?: StorageEventTargetLike
  users?: readonly DemoUserRecord[]
}

interface StoredSession {
  userId: string
}

function toAuthUser(record: DemoUserRecord): AuthUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
  }
}

function parseStoredSession(raw: string): StoredSession | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    const userId = (parsed as Record<string, unknown>).userId
    return typeof userId === "string" ? { userId } : null
  } catch {
    return null
  }
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const { storage, storageEvents, users = DEMO_USERS } = deps

  async function login(email: string, password: string): Promise<AuthUser> {
    const normalizedEmail = email.trim().toLowerCase()
    const record = users.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail && u.password === password,
    )
    if (!record) {
      throw new AuthServiceError(
        "invalid-credentials",
        "E-mail ou senha inválidos.",
      )
    }

    const session: StoredSession = { userId: record.id }
    try {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch {
      throw new AuthServiceError(
        "storage-unavailable",
        "Não foi possível salvar a sessão neste navegador.",
      )
    }
    return toAuthUser(record)
  }

  async function getCurrentUser(): Promise<AuthUser | null> {
    let raw: string | null
    try {
      raw = storage.getItem(SESSION_STORAGE_KEY)
    } catch {
      return null
    }
    if (raw === null) return null

    const session = parseStoredSession(raw)
    const record = session && users.find((u) => u.id === session.userId)
    if (!record) {
      // Sessão corrompida ou de um usuário que não existe mais: descarta.
      try {
        storage.removeItem(SESSION_STORAGE_KEY)
      } catch {
        // Sem armazenamento disponível, não há sessão a remover.
      }
      return null
    }
    return toAuthUser(record)
  }

  async function logout(): Promise<void> {
    // Se a remoção falhar, a sessão pode continuar salva: o erro sobe para
    // que a interface não aparente um logout que não aconteceu.
    try {
      storage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      throw new AuthServiceError(
        "storage-unavailable",
        "Não foi possível encerrar a sessão neste navegador. Tente novamente.",
      )
    }
  }

  function onSessionChange(listener: () => void): () => void {
    if (!storageEvents) return () => {}

    const handleStorage = (event: Event) => {
      // `key === null` indica `localStorage.clear()` em outra aba.
      const { key } = event as StorageEvent
      if (key === SESSION_STORAGE_KEY || key === null) listener()
    }
    storageEvents.addEventListener("storage", handleStorage)
    return () => storageEvents.removeEventListener("storage", handleStorage)
  }

  return { login, getCurrentUser, logout, onSessionChange }
}

const localStorageAdapter: SessionStorageLike = {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key)
  },
  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value)
  },
  removeItem(key: string): void {
    window.localStorage.removeItem(key)
  },
}

const windowStorageEvents: StorageEventTargetLike = {
  addEventListener(type, listener) {
    window.addEventListener(type, listener)
  },
  removeEventListener(type, listener) {
    window.removeEventListener(type, listener)
  },
}

/** Instância usada pela aplicação real, adaptando `window.localStorage`. */
export const authService: AuthService = createAuthService({
  storage: localStorageAdapter,
  storageEvents: windowStorageEvents,
})
