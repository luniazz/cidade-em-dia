import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  FileStack,
  ChevronDown,
  ArrowRight,
  LogOut,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { CHART_COLORS } from "../config/chart"
import { deriveRequestAnalytics } from "../domain/requestAnalytics"
import type {
  RequestCategoryId,
  RequestStatus,
  UrbanRequest,
} from "../domain/requests"
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  getRequestCategoryLabel,
  isRequestCategoryId,
  isRequestStatus,
} from "../domain/requests"
import { formatDateOnlyPtBR } from "../utils/date"
import { RequestServiceError, requestService } from "../services/requestService"
import StatusBadge from "../components/StatusBadge"

const STATUS_FILTER_OPTIONS: Array<{
  label: string
  val: RequestStatus | "all"
}> = [
  { label: "Todas", val: "all" },
  ...REQUEST_STATUSES.map((s) => ({ label: REQUEST_STATUS_LABELS[s], val: s })),
]

const PAGE_SIZE = 10

export default function AdminDashboard() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all")
  const [filterCategory, setFilterCategory] =
    useState<RequestCategoryId | "all">("all")
  const [requests, setRequests] = useState<UrbanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    requestService
      .getAll()
      .then((all) => {
        if (cancelled) return
        setRequests(all)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(
          err instanceof RequestServiceError
            ? err.message
            : "Não foi possível carregar as solicitações agora.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const analytics =
    !loading && !loadError ? deriveRequestAnalytics(requests, new Date()) : null

  const kpis = [
    {
      label: "Aguardando atendimento",
      val: analytics ? analytics.kpis.aguardandoAtendimento : "—",
      sub: "solicitações recebidas",
      color: "#243F73",
      bg: "#DCE5F7",
      icon: ClipboardList,
    },
    {
      label: "Em atendimento",
      val: analytics ? analytics.kpis.emAtendimento : "—",
      sub: "em andamento",
      color: "#7C3AED",
      bg: "#EDE9FE",
      icon: LayoutDashboard,
    },
    {
      label: "Resolvidas este mês",
      val: analytics ? analytics.kpis.resolvidasNoMes : "—",
      sub: "no mês atual",
      color: "#059669",
      bg: "#D1FAE5",
      icon: CheckCircle2,
    },
    {
      label: "Total de solicitações",
      val: analytics ? analytics.kpis.totalSolicitacoes : "—",
      sub: "registros cadastrados",
      color: "#D97706",
      bg: "#FEF3C7",
      icon: FileStack,
    },
  ]

  // Novas solicitações são adicionadas ao final do armazenamento; a
  // listagem exibida na tabela usa uma cópia invertida para mostrar as mais
  // recentes primeiro, sem alterar a ordem usada nos cálculos de KPIs e
  // gráficos.
  const filtered = [...requests].reverse().filter((r) => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    const matchCat = filterCategory === "all" || r.categoryId === filterCategory
    return matchStatus && matchCat
  })

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  // A página efetiva nunca ultrapassa o total de páginas válido para o
  // resultado filtrado atual, mesmo que `currentPage` ainda não tenha sido
  // sincronizada (ex.: um filtro acabou de reduzir o total de páginas).
  const effectivePage = Math.min(currentPage, totalPages)
  const firstIndex = (effectivePage - 1) * PAGE_SIZE
  const lastIndex = Math.min(firstIndex + PAGE_SIZE, totalFiltered)
  const pageItems = filtered.slice(firstIndex, lastIndex)

  useEffect(() => {
    if (currentPage !== effectivePage) {
      // Sincroniza o estado de página com o total de páginas válido após
      // uma redução do resultado filtrado; o slice do render já usa
      // `effectivePage`, então isso só evita que `currentPage` fique preso
      // num valor obsoleto.
      // oxlint-disable-next-line react/set-state-in-effect
      setCurrentPage(effectivePage)
    }
  }, [currentPage, effectivePage])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F6F8FC" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 border-r shrink-0"
        style={{ backgroundColor: "#243F73", borderColor: "#1d3460" }}
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
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: ClipboardList, label: "Solicitações", active: false },
          ].map((item) => (
            <div
              key={item.label}
              aria-current={item.active ? "page" : undefined}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: item.active
                  ? "rgba(255,255,255,0.12)"
                  : "transparent",
                color: item.active ? "white" : "#7A9ED4",
                fontFamily: "var(--font-display)",
              }}
            >
              <item.icon size={15} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "#1d3460" }}>
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all hover:bg-white/10"
            style={{ color: "#7A9ED4", fontFamily: "var(--font-display)" }}
          >
            <LogOut size={15} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="bg-white border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: "#DCE5F7" }}
        >
          <h1
            className="text-lg font-bold"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Dashboard
          </h1>
          <Link
            to="/"
            className="md:hidden text-sm font-medium"
            style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
          >
            Sair
          </Link>
        </header>

        <div className="p-4 sm:p-6 max-w-5xl">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border p-4"
                style={{ borderColor: "#DCE5F7" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: kpi.bg }}
                >
                  <kpi.icon size={18} style={{ color: kpi.color }} />
                </div>
                <p
                  className="text-2xl font-extrabold mb-0.5"
                  style={{
                    color: kpi.color,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {kpi.val}
                </p>
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: "#1a2535",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {kpi.label}
                </p>
                <p className="text-xs text-gray-500">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
            {/* Bar chart */}
            <div
              className="bg-white rounded-xl border p-4 lg:col-span-3"
              style={{ borderColor: "#DCE5F7" }}
            >
              <h2
                className="text-sm font-semibold mb-4"
                style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
              >
                Solicitações por dia (últimos 7 dias)
              </h2>
              {loading ? (
                <p className="text-xs text-gray-500 text-center py-16">
                  Carregando gráfico...
                </p>
              ) : loadError ? (
                <p className="text-xs text-gray-500 text-center py-16">
                  Gráfico indisponível no momento.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={analytics?.weeklySeries}
                    barSize={20}
                    barGap={4}
                  >
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #DCE5F7",
                        fontSize: 12,
                      }}
                      itemStyle={{ color: "#243F73" }}
                      cursor={{ fill: "#F6F8FC" }}
                    />
                    <Bar
                      dataKey="registradas"
                      name="Registradas"
                      fill="#5978B5"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="resolvidas"
                      name="Resolvidas"
                      fill="#DCE5F7"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart */}
            <div
              className="bg-white rounded-xl border p-4 lg:col-span-2"
              style={{ borderColor: "#DCE5F7" }}
            >
              <h2
                className="text-sm font-semibold mb-4"
                style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
              >
                Por categoria
              </h2>
              {loading ? (
                <p className="text-xs text-gray-500 text-center py-16">
                  Carregando gráfico...
                </p>
              ) : loadError ? (
                <p className="text-xs text-gray-500 text-center py-16">
                  Gráfico indisponível no momento.
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analytics?.categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {analytics?.categoryData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #DCE5F7",
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1 mt-1">
                    {analytics?.categoryData.map((d, i) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: CHART_COLORS[i] }}
                        />
                        <span className="text-gray-500 truncate">{d.name}</span>
                        <span
                          className="ml-auto font-semibold"
                          style={{ color: "#243F73" }}
                        >
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filters + Table */}
          <div
            className="bg-white rounded-xl border"
            style={{ borderColor: "#DCE5F7" }}
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3"
              style={{ borderColor: "#DCE5F7" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
              >
                Solicitações recentes
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "all" || isRequestStatus(value)) {
                        setFilterStatus(value)
                        setCurrentPage(1)
                      }
                    }}
                    aria-label="Filtrar por status"
                    className="text-xs rounded-lg border pl-3 pr-7 py-1.5 appearance-none"
                    style={{
                      borderColor: "#DCE5F7",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {STATUS_FILTER_OPTIONS.map((s) => (
                      <option key={s.val} value={s.val}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "all" || isRequestCategoryId(value)) {
                        setFilterCategory(value)
                        setCurrentPage(1)
                      }
                    }}
                    aria-label="Filtrar por categoria"
                    className="text-xs rounded-lg border pl-3 pr-7 py-1.5 appearance-none"
                    style={{
                      borderColor: "#DCE5F7",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    <option value="all">Todas as categorias</option>
                    {REQUEST_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Tabela de solicitações recentes com rolagem horizontal"
            >
              <table className="w-full text-sm min-w-160">
                <thead>
                  <tr style={{ backgroundColor: "#F6F8FC" }}>
                    {[
                      "Protocolo",
                      "Categoria",
                      "Endereço",
                      "Data",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-600 border-b"
                        style={{
                          borderColor: "#DCE5F7",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        Carregando solicitações...
                      </td>
                    </tr>
                  ) : loadError ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm"
                        style={{ color: "#DC2626" }}
                      >
                        {loadError}
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        Nenhuma solicitação encontrada com os filtros
                        selecionados.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((req) => (
                      <tr key={req.id}>
                        <td
                          className="px-4 py-3 font-mono text-xs font-medium"
                          style={{ color: "#243F73" }}
                        >
                          {req.protocol}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {getRequestCategoryLabel(req.categoryId)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">
                          {req.address}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDateOnlyPtBR(req.date) ?? "Data inválida"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/solicitacao/${req.protocol}`}
                            className="text-xs font-medium flex items-center gap-1"
                            style={{
                              color: "#5978B5",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            Ver <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && !loadError && totalFiltered > 0 ? (
              <div
                className="px-5 py-3 border-t flex items-center justify-between flex-wrap gap-3"
                style={{ borderColor: "#DCE5F7" }}
              >
                <p className="text-xs text-gray-500">
                  Mostrando {firstIndex + 1}–{lastIndex} de {totalFiltered}
                </p>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={effectivePage <= 1}
                      onClick={() => setCurrentPage(effectivePage - 1)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors enabled:cursor-pointer enabled:hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "#DCE5F7",
                        color: "#5978B5",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Anterior
                    </button>
                    <p
                      className="text-xs"
                      style={{
                        color: "#243F73",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Página {effectivePage} de {totalPages}
                    </p>
                    <button
                      type="button"
                      disabled={effectivePage >= totalPages}
                      onClick={() => setCurrentPage(effectivePage + 1)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors enabled:cursor-pointer enabled:hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "#DCE5F7",
                        color: "#5978B5",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Próxima
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
