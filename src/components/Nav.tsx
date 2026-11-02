import { LogIn, LogOut, MapPin, Menu, UserRound, X } from "lucide-react"
import { useState } from "react"
import { Link, NavLink } from "react-router"
import { useAuth } from "../context/AuthContext"
import { USER_ROLE_LABELS } from "../domain/auth"
import UserMenu, { useLogout } from "./UserMenu"
import ThemeToggle from "./ThemeToggle"

interface NavLinkItem {
  label: string
  to: string
}

const links: NavLinkItem[] = [
  { label: "Início", to: "/" },
  { label: "Registrar solicitação", to: "/nova-solicitacao" },
  { label: "Acompanhar solicitação", to: "/acompanhar" },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()
  const handleLogout = useLogout()

  return (
    <header
      className="bg-white border-b border-blue-100 sticky top-0 z-50"
      style={{ borderColor: "var(--cd-border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link
          to="/"
          className="flex items-center gap-2 text-navy font-extrabold text-lg tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--cd-navy)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--cd-primary)" }}
          >
            <MapPin size={16} color="white" strokeWidth={2.5} />
          </div>
          Cidade em Dia
        </Link>

        <div className="flex items-center gap-1">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/admin"
              className="ml-4 text-xs font-medium px-3 py-1.5 rounded-md border"
              style={{
                borderColor: "var(--cd-blue-solid)",
                color: "var(--cd-blue)",
                fontFamily: "var(--font-display)",
              }}
            >
              Área da Prefeitura
            </NavLink>
            {user ? (
              <UserMenu variant="public" />
            ) : (
              <NavLink
                to="/entrar"
                className={({ isActive }) =>
                  `nav-link ml-2 flex items-center gap-1.5 ${isActive ? "active" : ""}`
                }
              >
                <LogIn size={15} />
                Entrar
              </NavLink>
            )}
          </nav>

          <ThemeToggle variant="public" />

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md"
            style={{ color: "var(--cd-navy)" }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-white border-t px-4 pb-4 pt-2 flex flex-col gap-1"
          style={{ borderColor: "var(--cd-border)" }}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link text-left w-full ${isActive ? "active" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            onClick={() => setMenuOpen(false)}
            className="nav-link text-left"
            style={{ color: "var(--cd-blue)" }}
          >
            Área da Prefeitura
          </NavLink>
          <div
            className="border-t mt-1 pt-2 flex flex-col gap-1"
            style={{ borderColor: "var(--cd-border)" }}
          >
            {user ? (
              <>
                <p className="px-3 pb-1 text-xs text-gray-500">
                  {user.name} · {USER_ROLE_LABELS[user.role]}
                </p>
                <NavLink
                  to="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `nav-link text-left flex items-center gap-1.5 ${isActive ? "active" : ""}`
                  }
                >
                  <UserRound size={15} />
                  Meu perfil
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    void handleLogout()
                  }}
                  className="nav-link text-left flex items-center gap-1.5"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </>
            ) : (
              <NavLink
                to="/entrar"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-link text-left flex items-center gap-1.5 ${isActive ? "active" : ""}`
                }
              >
                <LogIn size={15} />
                Entrar
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
