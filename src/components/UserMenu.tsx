import { ChevronDown, LogOut, UserRound } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import { USER_ROLE_LABELS } from "../domain/auth"
import { AuthServiceError } from "../services/authService"

interface UserMenuProps {
  /** "public": cabeçalho público (menu suspenso); "admin": rodapé da sidebar. */
  variant: "public" | "admin"
}

/** Hook do logout compartilhado: encerra a sessão e volta para o início. */
export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return async () => {
    try {
      await logout()
    } catch (error) {
      // A sessão pode continuar salva: o usuário segue logado e é avisado.
      window.alert(
        error instanceof AuthServiceError
          ? error.message
          : "Não foi possível sair agora. Tente novamente.",
      )
      return
    }
    navigate("/", { replace: true })
  }
}

/** Identificação do usuário autenticado com as opções "Meu perfil" e "Sair". */
export default function UserMenu({ variant }: UserMenuProps) {
  const { user } = useAuth()
  const handleLogout = useLogout()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  if (!user) return null

  const roleLabel = USER_ROLE_LABELS[user.role]

  if (variant === "admin") {
    const itemClass =
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all hover:bg-white/10"
    const itemStyle = { color: "#7A9ED4", fontFamily: "var(--font-display)" }

    return (
      <div ref={containerRef}>
        {open && (
          <div id={menuId} className="flex flex-col gap-1 mb-1">
            <Link
              to="/perfil"
              className={itemClass}
              style={itemStyle}
              onClick={() => setOpen(false)}
            >
              <UserRound size={15} />
              Meu perfil
            </Link>
            <button
              type="button"
              className={itemClass}
              style={itemStyle}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              Sair
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={menuId}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left transition-all hover:bg-white/10"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <UserRound size={14} color="white" />
          </div>
          <span className="min-w-0 flex-1">
            <span
              className="block text-white text-sm font-semibold truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {user.name}
            </span>
            <span className="block text-xs" style={{ color: "#7A9ED4" }}>
              {roleLabel}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            style={{ color: "#7A9ED4" }}
          />
        </button>
      </div>
    )
  }

  const itemClass =
    "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-left transition-colors hover:bg-[#DCE5F7]"
  const itemStyle = { color: "#243F73", fontFamily: "var(--font-display)" }

  return (
    <div ref={containerRef} className="relative ml-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Menu do usuário ${user.name}`}
        className="nav-link flex items-center gap-1.5"
      >
        <UserRound size={16} />
        <span className="max-w-32 truncate">{user.name}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute right-0 mt-2 w-52 bg-white rounded-lg border p-1.5 shadow-lg"
          style={{ borderColor: "#DCE5F7" }}
        >
          <div
            className="px-3 py-2 mb-1 border-b"
            style={{ borderColor: "#DCE5F7" }}
          >
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
            >
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <Link
            to="/perfil"
            className={itemClass}
            style={itemStyle}
            onClick={() => setOpen(false)}
          >
            <UserRound size={15} />
            Meu perfil
          </Link>
          <button
            type="button"
            className={itemClass}
            style={itemStyle}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
