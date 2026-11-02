import type { Theme } from "../domain/theme"
import { isTheme } from "../domain/theme"

/**
 * Persistência local da preferência de tema, separada da sessão de
 * autenticação: o logout não a remove e visitantes também podem escolher.
 *
 * É síncrona (diferente dos demais serviços) porque o tema precisa ser
 * conhecido antes da primeira renderização para evitar flash de tema errado.
 * Falhas de armazenamento são ignoradas: a preferência é só conveniência
 * visual, e o tema continua funcionando durante a visita.
 */

/** Mesma chave usada pelo script inline do `index.html`. */
export const THEME_STORAGE_KEY = "cidade-em-dia:theme:v1"

export interface ThemeStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface ThemeService {
  getSavedTheme(): Theme | null
  saveTheme(theme: Theme): void
}

export function createThemeService(storage: ThemeStorageLike): ThemeService {
  return {
    getSavedTheme() {
      try {
        const saved = storage.getItem(THEME_STORAGE_KEY)
        return isTheme(saved) ? saved : null
      } catch {
        return null
      }
    },
    saveTheme(theme) {
      try {
        storage.setItem(THEME_STORAGE_KEY, theme)
      } catch {
        // Sem armazenamento disponível, o tema vale só para esta visita.
      }
    },
  }
}

/** Instância usada pela aplicação real, adaptando `window.localStorage`. */
export const themeService: ThemeService = createThemeService({
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
})
