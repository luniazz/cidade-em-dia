import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import type {
  RequestListLinkState,
  RequestListState,
} from "../domain/requestListing"
import {
  REQUEST_SORT_OPTIONS,
  changeRequestListFilters,
  filterRequests,
  paginate,
  parseRequestListParams,
  sortRequestsByDate,
  toRequestListParams,
} from "../domain/requestListing"
import type { UrbanRequest } from "../domain/requests"
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

const PAGE_SIZE = 10

export default function AdminSolicitacoes() {
  const handleLogout = useLogout()
  // Busca, filtros, ordenação e página ficam na URL: sobrevivem a F5 e o
  // "voltar" do detalhe retorna para a mesma visão.
  const [searchParams, setSearchParams] = useSearchParams()
  const listState = parseRequestListParams(searchParams)
  const [requests, setRequests] = useState<UrbanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    requestService
      .getAll()
      .then((all) => {
        if (!cancelled) setRequests(all)
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

  function updateListState(next: RequestListState) {
    // `replace` evita uma entrada no histórico a cada tecla digitada na busca.
    setSearchParams(toRequestListParams(next), { replace: true })
  }

  function changeFilters(change: Parameters<typeof changeRequestListFilters>[1]) {
    updateListState(changeRequestListFilters(listState, change))
  }

  const results = sortRequestsByDate(
    filterRequests(requests, listState),
    listState.sort,
  )
  const page = paginate(results, listState.page, PAGE_SIZE)
  const linkState: RequestListLinkState = {
    listSearch: `?${searchParams.toString()}`,
  }
  const emptyMessage =
    requests.length === 0
      ? "Nenhuma solicitação registrada até o momento."
      : "Nenhuma solicitação encontrada para a busca e os filtros selecionados."

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--cd-page)" }}>
      <AdminSidebar active="solicitacoes" />

      <div className="flex-1 min-w-0">
        <header
          className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4"
          style={{ borderColor: "var(--cd-border)" }}
        >
          <div className="min-w-0">
            <h1
              className="text-lg font-bold"
              style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
            >
              Solicitações
            </h1>
            <p className="text-xs text-gray-500">
              Consulte e gerencie as solicitações registradas.
            </p>
          </div>
          <div className="md:hidden flex items-center gap-2 shrink-0">
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
        <AdminMobileNav active="solicitacoes" />

        <div className="p-4 sm:p-6 max-w-5xl">
          <div
            className="bg-white rounded-xl border"
            style={{ borderColor: "var(--cd-border)" }}
          >
            {/* Busca e filtros */}
            <div
              className="px-5 py-4 border-b flex items-center flex-wrap gap-2"
              style={{ borderColor: "var(--cd-border)" }}
            >
              <div className="relative flex-1 min-w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="search"
                  value={listState.query}
                  onChange={(e) => changeFilters({ query: e.target.value })}
                  placeholder="Buscar por protocolo, endereço, descrição, nome ou e-mail"
                  aria-label="Buscar solicitações"
                  className="w-full text-xs rounded-lg border pl-8 pr-3 py-1.5"
                  style={{
                    borderColor: "var(--cd-border)",
                    fontFamily: "var(--font-display)",
                  }}
                />
              </div>
              <FilterSelect
                label="Filtrar por status"
                value={listState.status}
                onChange={(value) => {
                  if (value === "all" || isRequestStatus(value)) {
                    changeFilters({ status: value })
                  }
                }}
              >
                <option value="all">Todos os status</option>
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {REQUEST_STATUS_LABELS[s]}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Filtrar por categoria"
                value={listState.categoryId}
                onChange={(value) => {
                  if (value === "all" || isRequestCategoryId(value)) {
                    changeFilters({ categoryId: value })
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
              <FilterSelect
                label="Ordenar solicitações"
                value={listState.sort}
                onChange={(value) => {
                  if (value === "recentes" || value === "antigas") {
                    changeFilters({ sort: value })
                  }
                }}
              >
                {REQUEST_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FilterSelect>
            </div>

            <AdminRequestTable
              items={page.items}
              loading={loading}
              error={loadError}
              emptyMessage={emptyMessage}
              ariaLabel="Tabela de solicitações com rolagem horizontal"
              linkState={linkState}
            />

            {!loading && !loadError ? (
              <RequestPagination
                page={page}
                onPageChange={(n) => updateListState({ ...listState, page: n })}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
