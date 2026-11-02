import { ClipboardList, House, LayoutDashboard } from "lucide-react"
import { Link } from "react-router"
import ThemeToggle from "./ThemeToggle"
import UserMenu from "./UserMenu"

export type AdminSection = "dashboard" | "solicitacoes"

const ITEMS = [
  {
    section: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    to: "/admin",
  },
  {
    section: "solicitacoes",
    icon: ClipboardList,
    label: "Solicitações",
    to: "/admin/solicitacoes",
  },
] as const

/**
 * Volta para a área pública sem encerrar a sessão (diferente de "Sair").
 * "sidebar": item da sidebar; "header": ícone no cabeçalho mobile.
 */
export function AdminHomeLink({ variant }: { variant: "sidebar" | "header" }) {
  if (variant === "header") {
    return (
      <Link
        to="/"
        aria-label="Página inicial"
        title="Página inicial"
        className="nav-link p-2 flex items-center"
      >
        <House size={18} />
      </Link>
    )
  }

  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all hover:bg-white/10"
      style={{ color: "#7A9ED4", fontFamily: "var(--font-display)" }}
    >
      <House size={15} />
      Página inicial
    </Link>
  )
}

/**
 * Navegação entre as seções no mobile, onde a sidebar fica oculta. Usa as
 * mesmas seções da sidebar e o estilo das abas do cabeçalho público.
 */
export function AdminMobileNav({ active }: { active: AdminSection }) {
  return (
    <nav
      aria-label="Seções da Área da Prefeitura"
      className="md:hidden bg-white border-b px-4 py-2 flex gap-1"
      style={{ borderColor: "var(--cd-border)" }}
    >
      {ITEMS.map((item) => {
        const isActive = item.section === active
        return (
          <Link
            key={item.section}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className={`nav-link flex items-center gap-1.5 ${isActive ? "active" : ""}`}
          >
            <item.icon size={14} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Sidebar da Área da Prefeitura (oculta no mobile), com a seção ativa. */
export default function AdminSidebar({ active }: { active: AdminSection }) {
  return (
    <aside
      className="hidden md:flex flex-col w-56 border-r shrink-0"
      style={{ backgroundColor: "var(--cd-brand)", borderColor: "#1d3460" }}
    >
      <div className="px-5 py-5 border-b" style={{ borderColor: "#1d3460" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
            <LayoutDashboard size={14} color="white" />
          </div>
          <span
            className="text-white font-bold text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cidade em Dia
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "#7A9ED4" }}>
          Área da Prefeitura
        </p>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {ITEMS.map((item) => {
          const isActive = item.section === active
          return (
            <Link
              key={item.section}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "" : "hover:bg-white/10"}`}
              style={{
                // Sem fundo inline no item inativo, para o hover da classe valer.
                backgroundColor: isActive ? "rgba(255,255,255,0.12)" : undefined,
                color: isActive ? "white" : "#7A9ED4",
                fontFamily: "var(--font-display)",
              }}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "#1d3460" }}>
        <AdminHomeLink variant="sidebar" />
        <ThemeToggle variant="admin" />
        <UserMenu variant="admin" />
      </div>
    </aside>
  )
}
