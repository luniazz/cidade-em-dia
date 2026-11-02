import { describe, expect, it } from "vitest"
import { resolveInitialTheme } from "../domain/theme"
import { createAuthService } from "./authService"
import { THEME_STORAGE_KEY, createThemeService } from "./themeService"

function createFakeStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}))
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
  return { storage, store }
}

/** Tema que a aplicação usaria ao abrir com este armazenamento e sistema. */
function initialThemeFor(
  storage: ReturnType<typeof createFakeStorage>["storage"],
  systemPrefersDark: boolean,
) {
  const saved = createThemeService(storage).getSavedTheme()
  return resolveInitialTheme(saved, systemPrefersDark)
}

describe("tema inicial", () => {
  it("usa a preferência salva dark", () => {
    const { storage } = createFakeStorage({ [THEME_STORAGE_KEY]: "dark" })
    expect(initialThemeFor(storage, false)).toBe("dark")
  })

  it("usa a preferência salva light", () => {
    const { storage } = createFakeStorage({ [THEME_STORAGE_KEY]: "light" })
    expect(initialThemeFor(storage, false)).toBe("light")
  })

  it("sem preferência, segue o sistema escuro", () => {
    const { storage } = createFakeStorage()
    expect(initialThemeFor(storage, true)).toBe("dark")
  })

  it("sem preferência, segue o sistema claro", () => {
    const { storage } = createFakeStorage()
    expect(initialThemeFor(storage, false)).toBe("light")
  })

  it("a escolha manual prevalece sobre o sistema", () => {
    const { storage } = createFakeStorage({ [THEME_STORAGE_KEY]: "light" })
    expect(initialThemeFor(storage, true)).toBe("light")
  })

  it("ignora valor salvo inválido e segue o sistema", () => {
    const { storage } = createFakeStorage({ [THEME_STORAGE_KEY]: "azul" })
    expect(initialThemeFor(storage, true)).toBe("dark")
  })
})

describe("persistência", () => {
  it("a alternância salva só o tema e sobrevive a um novo carregamento", () => {
    const { storage, store } = createFakeStorage()
    createThemeService(storage).saveTheme("dark")

    expect(store.get(THEME_STORAGE_KEY)).toBe("dark")
    expect(initialThemeFor(storage, false)).toBe("dark")
  })

  it("o logout não remove o tema", async () => {
    const { storage, store } = createFakeStorage()
    createThemeService(storage).saveTheme("dark")
    const auth = createAuthService({ storage })
    await auth.login("cidadao@cidadeemdia.com.br", "cidadao123")

    await auth.logout()

    expect(store.get(THEME_STORAGE_KEY)).toBe("dark")
  })

  it("falha de armazenamento não quebra a leitura nem a escrita", () => {
    const service = createThemeService({
      getItem: () => {
        throw new Error("bloqueado")
      },
      setItem: () => {
        throw new Error("bloqueado")
      },
    })

    expect(service.getSavedTheme()).toBeNull()
    expect(() => service.saveTheme("dark")).not.toThrow()
  })
})
