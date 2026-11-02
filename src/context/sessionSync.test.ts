import { describe, expect, it } from "vitest"
import type { AuthUser } from "../domain/auth"
import { ADMIN_ROLES, resolveRouteAccess } from "../domain/auth"
import type { SessionStorageLike } from "../services/authService"
import { createAuthService } from "../services/authService"
import { startSessionSync } from "./sessionSync"

const SESSION_STORAGE_KEY = "cidade-em-dia:session:v1"

/** Duas abas compartilham o mesmo `localStorage`, como no navegador. */
function createSharedStorage(): SessionStorageLike {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}

function storageEvent(key: string): Event {
  const event = new Event("storage")
  Object.defineProperty(event, "key", { value: key })
  return event
}

function pageShowEvent(persisted: boolean): Event {
  const event = new Event("pageshow")
  Object.defineProperty(event, "persisted", { value: persisted })
  return event
}

/** Espelha o estado mantido pelo AuthProvider de uma aba. */
function createTab(storage: SessionStorageLike) {
  const window = new EventTarget()
  const service = createAuthService({ storage, storageEvents: window })
  const state = { user: null as AuthUser | null, ready: false }
  const stop = startSessionSync(service, window, {
    onRevalidating: () => {
      state.ready = false
    },
    onSessionResolved: (user) => {
      state.user = user
      state.ready = true
    },
  })
  /** O que a rota /admin exibiria: nada enquanto a sessão não está pronta. */
  const adminView = () =>
    state.ready ? resolveRouteAccess(state.user, ADMIN_ROLES) : "loading"
  return { window, service, state, stop, adminView }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("startSessionSync", () => {
  it("logout em outra aba invalida a sessão sem recarregar", async () => {
    const storage = createSharedStorage()
    const tabA = createTab(storage)
    const tabB = createTab(storage)
    await tabA.service.login("admin@cidadeemdia.gov.br", "admin123")
    tabB.window.dispatchEvent(storageEvent(SESSION_STORAGE_KEY))
    await flush()
    expect(tabB.adminView()).toBe("allowed")

    await tabA.service.logout()
    tabB.window.dispatchEvent(storageEvent(SESSION_STORAGE_KEY))
    await flush()

    expect(tabB.state.user).toBeNull()
    expect(tabB.adminView()).toBe("login-required")
  })

  it("restauração por bfcache oculta o conteúdo protegido e não revive a sessão", async () => {
    const storage = createSharedStorage()
    const tab = createTab(storage)
    await tab.service.login("admin@cidadeemdia.gov.br", "admin123")
    tab.window.dispatchEvent(pageShowEvent(true))
    await flush()
    expect(tab.adminView()).toBe("allowed")

    // Logout feito em outro documento; a página antiga volta do bfcache.
    storage.removeItem(SESSION_STORAGE_KEY)
    tab.window.dispatchEvent(pageShowEvent(true))

    // Imediatamente: nada protegido visível com o usuário antigo.
    expect(tab.adminView()).toBe("loading")
    await flush()
    expect(tab.state.user).toBeNull()
    expect(tab.adminView()).toBe("login-required")
  })

  it("remove os listeners no cleanup", async () => {
    const storage = createSharedStorage()
    const tab = createTab(storage)
    await flush()
    tab.stop()

    await createAuthService({ storage }).login(
      "admin@cidadeemdia.gov.br",
      "admin123",
    )
    tab.window.dispatchEvent(storageEvent(SESSION_STORAGE_KEY))
    tab.window.dispatchEvent(pageShowEvent(true))
    await flush()

    expect(tab.state).toEqual({ user: null, ready: true })
  })
})
