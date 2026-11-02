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
  ArrowRight,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { CHART_COLORS } from "../config/chart"
import { deriveRequestAnalytics } from "../domain/requestAnalytics"
import { filterRequests, paginate } from "../domain/requestListing"
import type {
  RequestCategoryId,
  RequestStatus,
  UrbanRequest,
} from "../domain/requests"
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  isRequestCategoryId,
  isRequestStatus,
} from "../domain/requests"
import { RequestServiceError, requestService } from "../services/requestService"
import AdminRequestTable from "../components/AdminRequestTable"
import AdminSidebar, {
  AdminHomeLink,
  AdminMobileNav,
} from "../components/AdminSidebar"
import FilterSelect from "../components/FilterSelect"
import RequestPagination from "../components/RequestPagination"
import ThemeToggle from "../components/ThemeToggle"
import { useLogout } from "../components/UserMenu"

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
  const handleLogout = useLogout()

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
      color: "var(--cd-navy)",
      bg: "var(--cd-mist)",
      icon: ClipboardList,
    },
    {
      label: "Em atendimento",
      val: analytics ? analytics.kpis.emAtendimento : "—",
      sub: "em andamento",
      color: "var(--cd-purple)",
      bg: "var(--cd-purple-tint)",
      icon: LayoutDashboard,
    },
    {
      label: "Resolvidas este mês",
      val: analytics ? analytics.kpis.resolvidasNoMes : "—",
      sub: "no mês atual",
      color: "var(--cd-green)",
      bg: "var(--cd-green-tint)",
      icon: CheckCircle2,
    },
    {
      label: "Total de solicitações",
      val: analytics ? analytics.kpis.totalSolicitacoes : "—",
      sub: "registros cadastrados",
      color: "var(--cd-amber)",
      bg: "var(--cd-amber-tint-strong)",
      icon: FileStack,
    },
  ]

  // Novas solicitações são adicionadas ao final do armazenamento; a
  // listagem exibida na tabela usa uma cópia invertida para mostrar as mais
  // recentes primeiro, sem alterar a ordem usada nos cálculos de KPIs e
  // gráficos.
  const filtered = filterRequests([...requests].reverse(), {
    query: "",
    status: filterStatus,
    categoryId: filterCategory,
  })
  // A página efetiva nunca ultrapassa o total de páginas válido para o
  // resultado filtrado atual, mesmo que `currentPage` ainda não tenha sido
  // sincronizada (ex.: um filtro acabou de reduzir o total de páginas).
  const page = paginate(filtered, currentPage, PAGE_SIZE)
  const effectivePage = page.page

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
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--cd-page)" }}>
      <AdminSidebar active="dashboard" />

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="bg-white border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: "var(--cd-border)" }}
        >
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
          >
            Dashboard
          </h1>
          <div className="md:hidden flex items-center gap-2">
            <AdminHomeLink variant="header" />
            <ThemeToggle variant="public" />
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium"
              style={{ color: "var(--cd-blue)", fontFamily: "var(--font-display)" }}
            >
              Sair
            </button>
          </div>
        </header>
        <AdminMobileNav active="dashboard" />

        <div className="p-4 sm:p-6 max-w-5xl">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border p-4"
                style={{ borderColor: "var(--cd-border)" }}
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
                    color: "var(--cd-ink)",
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
              style={{ borderColor: "var(--cd-border)" }}
            >
              <h2
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
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
                      tick={{ fontSize: 11, fill: "var(--cd-faint)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--cd-faint)" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--cd-border)",
                        backgroundColor: "var(--cd-surface)",
                        fontSize: 12,
                      }}
                      itemStyle={{ color: "var(--cd-navy)" }}
                      cursor={{ fill: "var(--cd-page)" }}
                    />
                    <Bar
                      dataKey="registradas"
                      name="Registradas"
                      fill="var(--cd-blue-solid)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="resolvidas"
                      name="Resolvidas"
                      fill="var(--cd-chart-bar-2)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart */}
            <div
              className="bg-white rounded-xl border p-4 lg:col-span-2"
              style={{ borderColor: "var(--cd-border)" }}
            >
              <h2
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
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
                        stroke="var(--cd-surface)"
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
                          border: "1px solid var(--cd-border)",
                          backgroundColor: "var(--cd-surface)",
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
                          style={{ color: "var(--cd-navy)" }}
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
            style={{ borderColor: "var(--cd-border)" }}
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3"
              style={{ borderColor: "var(--cd-border)" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
              >
                Solicitações recentes
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <FilterSelect
                  label="Filtrar por status"
                  value={filterStatus}
                  onChange={(value) => {
                    if (value === "all" || isRequestStatus(value)) {
                      setFilterStatus(value)
                      setCurrentPage(1)
                    }
                  }}
                >
                  {STATUS_FILTER_OPTIONS.map((s) => (
                    <option key={s.val} value={s.val}>
                      {s.label}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  label="Filtrar por categoria"
                  value={filterCategory}
                  onChange={(value) => {
                    if (value === "all" || isRequestCategoryId(value)) {
                      setFilterCategory(value)
                      setCurrentPage(1)
                    }
                  }}
                >
                  <option value="all">Todas as categorias</option>
                  {REQUEST_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </FilterSelect>
                <Link
                  to="/admin/solicitacoes"
                  className="text-xs font-medium flex items-center gap-1"
                  style={{
                    color: "var(--cd-blue)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <AdminRequestTable
              items={page.items}
              loading={loading}
              error={loadError}
              emptyMessage="Nenhuma solicitação encontrada com os filtros selecionados."
              ariaLabel="Tabela de solicitações recentes com rolagem horizontal"
            />

            {!loading && !loadError ? (
              <RequestPagination page={page} onPageChange={setCurrentPage} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
