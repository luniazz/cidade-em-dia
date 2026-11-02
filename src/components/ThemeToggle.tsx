import { Moon, Sun } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

interface ThemeToggleProps {
  /** "public": botão de ícone no cabeçalho; "admin": item da sidebar. */
  variant: "public" | "admin"
}

/** Alterna entre modo claro e escuro; o ícone mostra o modo de destino. */
export default function ThemeToggle({ variant }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro"
  const Icon = isDark ? Sun : Moon

  if (variant === "admin") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={label}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all hover:bg-white/10"
        style={{ color: "#7A9ED4", fontFamily: "var(--font-display)" }}
      >
        <Icon size={15} />
        {isDark ? "Modo claro" : "Modo escuro"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="nav-link p-2 flex items-center"
    >
      <Icon size={18} />
    </button>
  )
}
