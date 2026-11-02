import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"
import type { ReactNode } from "react"
import type { Theme } from "../domain/theme"
import { resolveInitialTheme } from "../domain/theme"
import { themeService } from "../services/themeService"

interface ThemeContextValue {
  theme: Theme
  toggleTheme(): void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)"

function systemPrefersDark(): boolean {
  return window.matchMedia?.(DARK_SCHEME_QUERY).matches ?? false
}

/**
 * Tema visual da aplicação. Aplica a classe `dark` no `<html>`, que troca os
 * valores das variáveis de cor definidas em `index.css`.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [hasManualChoice, setHasManualChoice] = useState(
    () => themeService.getSavedTheme() !== null,
  )
  const [theme, setTheme] = useState<Theme>(() =>
    resolveInitialTheme(themeService.getSavedTheme(), systemPrefersDark()),
  )

  // Layout effect: a classe muda antes do paint, sem um quadro com o tema antigo.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  // Sem escolha manual, acompanha mudanças do tema do sistema em tempo real.
  useEffect(() => {
    if (hasManualChoice || !window.matchMedia) return
    const query = window.matchMedia(DARK_SCHEME_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light")
    }
    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [hasManualChoice])

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    themeService.saveTheme(next)
    setHasManualChoice(true)
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider>.")
  }
  return context
}
