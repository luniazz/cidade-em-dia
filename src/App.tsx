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
        style={{ backgroundColor: "#F6F8FC" }}
      >
        <div
          className="max-w-md text-center rounded-xl border p-6"
          style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}
        >
          <p
            className="font-semibold text-sm mb-1"
            style={{ color: "#DC2626", fontFamily: "var(--font-display)" }}
          >
            Não foi possível carregar o Cidade em Dia
          </p>
          <p className="text-xs text-red-600">{initError}</p>
        </div>
      </div>
    )
  }

  if (!appReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F6F8FC" }}
      >
        <p
          className="text-sm"
          style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
        >
          Carregando...
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F6F8FC" }}
    >
      <ScrollToTop />
      {!isAdmin && <Nav />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nova-solicitacao" element={<NovaSolicitacao />} />
        <Route path="/solicitacao/sucesso" element={<Sucesso />} />
        <Route path="/acompanhar" element={<Acompanhar />} />
        <Route path="/solicitacao/:protocolo" element={<Detalhes />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="/admin/solicitacao/:protocolo"
          element={<AdminDetalhe />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Footer */}
      {!isAdmin && (
        <footer
          className="mt-auto border-t py-6"
          style={{ borderColor: "#DCE5F7", backgroundColor: "white" }}
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
