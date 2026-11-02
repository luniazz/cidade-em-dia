import { describe, expect, it, vi } from "vitest"
import { ADMIN_ROLES, hasAllowedRole } from "../domain/auth"
import {
  AuthServiceError,
  createAuthService,
  type SessionStorageLike,
} from "./authService"

const SESSION_STORAGE_KEY = "cidade-em-dia:session:v1"

function createFakeStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}))
  const storage: SessionStorageLike = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
  return { storage, store }
}

describe("login", () => {
  it("autentica o cidadão de demonstração e retorna o perfil sem senha", async () => {
    const { storage } = createFakeStorage()
    const service = createAuthService({ storage })

    const user = await service.login("cidadao@cidadeemdia.com.br", "cidadao123")

    expect(user).toEqual({
      id: "demo-cidadao",
      name: "João da Silva",
      email: "cidadao@cidadeemdia.com.br",
      role: "cidadao",
    })
    expect(user).not.toHaveProperty("password")
  })

  it("aceita e-mail com espaços e maiúsculas", async () => {
    const { storage } = createFakeStorage()
    const service = createAuthService({ storage })

    const user = await service.login("  ADMIN@cidadeemdia.gov.br ", "admin123")

    expect(user.role).toBe("atendente")
  })

  it("rejeita senha incorreta sem criar sessão", async () => {
    const { storage, store } = createFakeStorage()
    const service = createAuthService({ storage })

    await expect(
      service.login("admin@cidadeemdia.gov.br", "errada"),
    ).rejects.toBeInstanceOf(AuthServiceError)
    expect(store.has(SESSION_STORAGE_KEY)).toBe(false)
  })

  it("rejeita e-mail desconhecido", async () => {
    const { storage } = createFakeStorage()
    const service = createAuthService({ storage })

    await expect(
      service.login("ninguem@exemplo.com", "admin123"),
    ).rejects.toMatchObject({ code: "invalid-credentials" })
  })

  it("persiste somente o id do usuário, nunca a senha", async () => {
    const { storage, store } = createFakeStorage()
    const service = createAuthService({ storage })

    await service.login("cidadao@cidadeemdia.com.br", "cidadao123")

    const raw = store.get(SESSION_STORAGE_KEY)
    expect(raw).toBe(JSON.stringify({ userId: "demo-cidadao" }))
    expect(raw).not.toContain("cidadao123")
  })
})

describe("getCurrentUser", () => {
  it("retorna null sem sessão", async () => {
    const { storage } = createFakeStorage()
    const service = createAuthService({ storage })

    expect(await service.getCurrentUser()).toBeNull()
  })

  it("restaura a sessão após um novo carregamento", async () => {
    const { storage } = createFakeStorage()
    await createAuthService({ storage }).login(
      "admin@cidadeemdia.gov.br",
      "admin123",
    )

    const reloaded = createAuthService({ storage })

    expect(await reloaded.getCurrentUser()).toMatchObject({
      id: "demo-atendente",
      role: "atendente",
    })
  })

  it("descarta sessão corrompida", async () => {
    const { storage, store } = createFakeStorage({
      [SESSION_STORAGE_KEY]: "{inválido",
    })
    const service = createAuthService({ storage })

    expect(await service.getCurrentUser()).toBeNull()
    expect(store.has(SESSION_STORAGE_KEY)).toBe(false)
  })

  it("descarta sessão de usuário inexistente", async () => {
    const { storage, store } = createFakeStorage({
      [SESSION_STORAGE_KEY]: JSON.stringify({ userId: "desconhecido" }),
    })
    const service = createAuthService({ storage })

    expect(await service.getCurrentUser()).toBeNull()
    expect(store.has(SESSION_STORAGE_KEY)).toBe(false)
  })
})

describe("logout", () => {
  it("remove a sessão", async () => {
    const { storage, store } = createFakeStorage()
    const service = createAuthService({ storage })
    await service.login("cidadao@cidadeemdia.com.br", "cidadao123")

    await service.logout()

    expect(store.has(SESSION_STORAGE_KEY)).toBe(false)
    expect(await service.getCurrentUser()).toBeNull()
  })

  it("revalidar a sessão após logout feito por outro documento retorna null", async () => {
    // Simula a página restaurada do bfcache: o documento antigo tinha um
    // usuário logado, e o logout aconteceu depois em outro documento.
    const { storage } = createFakeStorage()
    const staleDocument = createAuthService({ storage })
    await staleDocument.login("admin@cidadeemdia.gov.br", "admin123")
    expect(await staleDocument.getCurrentUser()).not.toBeNull()

    await createAuthService({ storage }).logout()

    expect(await staleDocument.getCurrentUser()).toBeNull()
  })

  it("falha explicitamente quando a sessão não pode ser removida", async () => {
    const { storage } = createFakeStorage()
    const service = createAuthService({
      storage: {
        ...storage,
        removeItem: () => {
          throw new Error("bloqueado")
        },
      },
    })
    await service.login("cidadao@cidadeemdia.com.br", "cidadao123")

    await expect(service.logout()).rejects.toMatchObject({
      code: "storage-unavailable",
    })
  })
})

describe("onSessionChange", () => {
  function storageEvent(key: string | null): Event {
    const event = new Event("storage")
    Object.defineProperty(event, "key", { value: key })
    return event
  }

  it("avisa apenas alterações da chave de sessão e para após o cleanup", () => {
    const { storage } = createFakeStorage()
    const storageEvents = new EventTarget()
    const service = createAuthService({ storage, storageEvents })
    const listener = vi.fn()
    const stop = service.onSessionChange(listener)

    storageEvents.dispatchEvent(storageEvent("outra-chave"))
    storageEvents.dispatchEvent(storageEvent(SESSION_STORAGE_KEY))
    storageEvents.dispatchEvent(storageEvent(null))
    stop()
    storageEvents.dispatchEvent(storageEvent(SESSION_STORAGE_KEY))

    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe("hasAllowedRole", () => {
  it("autoriza o atendente e nega o cidadão na Área da Prefeitura", () => {
    const base = { id: "x", name: "X", email: "x@x.com" }

    expect(hasAllowedRole({ ...base, role: "atendente" }, ADMIN_ROLES)).toBe(
      true,
    )
    expect(hasAllowedRole({ ...base, role: "cidadao" }, ADMIN_ROLES)).toBe(
      false,
    )
  })
})
