/** Temas visuais disponíveis. */
export type Theme = "light" | "dark"

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark"
}

/**
 * Tema inicial: a escolha manual salva prevalece; sem ela, segue a preferência
 * do sistema operacional (`prefers-color-scheme`).
 *
 * O script inline do `index.html` repete esta regra para aplicar o tema antes
 * do primeiro paint; ao alterá-la, atualize os dois lugares.
 */
export function resolveInitialTheme(
  savedTheme: Theme | null,
  systemPrefersDark: boolean,
): Theme {
  if (savedTheme) return savedTheme
  return systemPrefersDark ? "dark" : "light"
}
