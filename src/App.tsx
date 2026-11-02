import { useEffect, useState } from "react"
import { Route, Routes, useLocation } from "react-router"
import Nav from "./components/Nav"
import Home from "./screens/Home"
import NovaSolicitacao from "./screens/NovaSolicitacao"
import Sucesso from "./screens/Sucesso"
import Acompanhar from "./screens/Acompanhar"
import Detalhes from "./screens/Detalhes"
import AdminDashboard from "./screens/AdminDashboard"
import AdminDetalhe from "./screens/AdminDetalhe"
import NotFound from "./screens/NotFound"
import Entrar from "./screens/Entrar"
import Perfil from "./screens/Perfil"
import RequireAuth from "./components/RequireAuth"
import { useAuth } from "./context/AuthContext"
import { ADMIN_ROLES } from "./domain/auth"
import { RequestServiceError, requestService } from "./services/requestService"

/** Restaura o topo da página a cada troca de rota. */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const { pathname } = useLocation()
  const { ready: authReady } = useAuth()
  const normalizedPathname = pathname.toLowerCase()

  // Só "/admin" e sub-rotas reais de "/admin/" usam o layout administrativo —
  // startsWith("/admin") sozinho também casaria com um hipotético
  // "/administracao", por exemplo.
  const isAdmin =
    normalizedPathname === "/admin" || normalizedPathname.startsWith("/admin/")

  useEffect(() => {
    requestService
      .initialize()
      .then(() => setAppReady(true))
      .catch((error: unknown) => {
        setInitError(
          error instanceof RequestServiceError
            ? error.message
            : "Não foi possível inicializar o armazenamento local do navegador.",
        )
      })
  }, [])

  if (initError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--cd-page)" }}
      >
        <div
          className="max-w-md text-center rounded-xl border p-6"
          style={{ borderColor: "var(--cd-danger-border)", backgroundColor: "var(--cd-danger-bg)" }}
        >
          <p
            className="font-semibold text-sm mb-1"
            style={{ color: "var(--cd-danger)", fontFamily: "var(--font-display)" }}
          >
            Não foi possível carregar o Cidade em Dia
          </p>
          <p className="text-xs text-red-600">{initError}</p>
        </div>
      </div>
    )
  }

  // Também aguarda a restauração da sessão, para que as rotas protegidas não
  // redirecionem para o login antes de saber se já existe um usuário logado.
  if (!appReady || !authReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--cd-page)" }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--cd-blue)", fontFamily: "var(--font-display)" }}
        >
          Carregando...
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--cd-page)" }}
    >
      <ScrollToTop />
      {!isAdmin && <Nav />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nova-solicitacao" element={<NovaSolicitacao />} />
        <Route path="/solicitacao/sucesso" element={<Sucesso />} />
        <Route path="/acompanhar" element={<Acompanhar />} />
        <Route path="/solicitacao/:protocolo" element={<Detalhes />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route element={<RequireAuth />}>
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route element={<RequireAuth allowedRoles={ADMIN_ROLES} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route
            path="/admin/solicitacao/:protocolo"
            element={<AdminDetalhe />}
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Footer */}
      {!isAdmin && (
        <footer
          className="mt-auto border-t py-6"
          style={{ borderColor: "var(--cd-border)", backgroundColor: "var(--cd-surface)" }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <span>© 2026 Cidade em Dia</span>
            <span>Desenvolvido com transparência e cidadania</span>
          </div>
        </footer>
      )}
    </div>
  )
}
