import { MapPin, Menu, X } from "lucide-react"
import { useState } from "react"
import { Link, NavLink } from "react-router"

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

  return (
    <header
      className="bg-white border-b border-blue-100 sticky top-0 z-50"
      style={{ borderColor: "#DCE5F7" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link
          to="/"
          className="flex items-center gap-2 text-navy font-extrabold text-lg tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "#243F73" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#243F73" }}
          >
            <MapPin size={16} color="white" strokeWidth={2.5} />
          </div>
          Cidade em Dia
        </Link>

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
              borderColor: "#5978B5",
              color: "#5978B5",
              fontFamily: "var(--font-display)",
            }}
          >
            Área da Prefeitura
          </NavLink>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-md"
          style={{ color: "#243F73" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-white border-t px-4 pb-4 pt-2 flex flex-col gap-1"
          style={{ borderColor: "#DCE5F7" }}
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
            style={{ color: "#5978B5" }}
          >
            Área da Prefeitura
          </NavLink>
        </div>
      )}
    </header>
  )
}
