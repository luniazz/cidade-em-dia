import type { RequestCategoryId, RequestStatus, UrbanRequest } from "./requests"
import { isRequestCategoryId, isRequestStatus } from "./requests"

/**
 * Regras puras de listagem administrativa: busca, filtros, ordenação e
 * paginação. Usadas pelo Dashboard ("Solicitações recentes") e pela página
 * Solicitações, para que as duas telas apliquem as mesmas regras.
 */

export interface RequestFilters {
  /** Texto livre; vazio não filtra. */
  query: string
  status: RequestStatus | "all"
  categoryId: RequestCategoryId | "all"
}

export type RequestSortOrder = "recentes" | "antigas"

export const REQUEST_SORT_OPTIONS: ReadonlyArray<{
  value: RequestSortOrder
  label: string
}> = [
  { value: "recentes", label: "Mais recentes primeiro" },
  { value: "antigas", label: "Mais antigas primeiro" },
]

function normalizeText(value: string): string {
  // Ignora maiúsculas e acentos: "iluminacao" encontra "Iluminação".
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

/**
 * Filtra por status, categoria e texto. O texto é procurado em protocolo,
 * endereço, descrição, nome e e-mail do solicitante. Preserva a ordem recebida.
 */
export function filterRequests(
  requests: readonly UrbanRequest[],
  filters: RequestFilters,
): UrbanRequest[] {
  const query = normalizeText(filters.query)
  return requests.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false
    if (filters.categoryId !== "all" && r.categoryId !== filters.categoryId) {
      return false
    }
    if (!query) return true
    return [r.protocol, r.address, r.description, r.name, r.email].some(
      (field) => field !== undefined && normalizeText(field).includes(query),
    )
  })
}

/**
 * Ordena pela data de abertura. Na mesma data, a solicitação registrada
 * depois (posição maior no armazenamento) é considerada mais recente.
 */
export function sortRequestsByDate(
  requests: readonly UrbanRequest[],
  order: RequestSortOrder,
): UrbanRequest[] {
  const direction = order === "recentes" ? -1 : 1
  return requests
    .map((request, index) => ({ request, index }))
    .sort((a, b) => {
      if (a.request.date !== b.request.date) {
        return a.request.date < b.request.date ? -direction : direction
      }
      return (a.index - b.index) * direction
    })
    .map(({ request }) => request)
}

export interface Page<T> {
  items: T[]
  /** Página efetiva, limitada ao intervalo válido. */
  page: number
  totalPages: number
  total: number
  /** Posição (1-based) do primeiro e do último item exibidos. */
  firstItem: number
  lastItem: number
}

/**
 * Recorta uma página. A página pedida é limitada ao intervalo válido, para
 * que um filtro que reduza o resultado nunca exiba uma página vazia.
 */
export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
): Page<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  return {
    items: items.slice(start, end),
    page,
    totalPages,
    total,
    firstItem: total === 0 ? 0 : start + 1,
    lastItem: end,
  }
}

/** Estado da página Solicitações, mantido na URL (sobrevive a F5 e Voltar). */
export interface RequestListState extends RequestFilters {
  sort: RequestSortOrder
  page: number
}

const PARAM = {
  query: "busca",
  status: "status",
  categoryId: "categoria",
  sort: "ordem",
  page: "pagina",
} as const

/** Lê o estado da URL, ignorando valores inválidos. */
export function parseRequestListParams(
  params: URLSearchParams,
): RequestListState {
  const status = params.get(PARAM.status) ?? ""
  const categoryId = params.get(PARAM.categoryId) ?? ""
  const page = Number.parseInt(params.get(PARAM.page) ?? "", 10)
  return {
    query: params.get(PARAM.query) ?? "",
    status: isRequestStatus(status) ? status : "all",
    categoryId: isRequestCategoryId(categoryId) ? categoryId : "all",
    sort: params.get(PARAM.sort) === "antigas" ? "antigas" : "recentes",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

/** Gera a URL do estado, omitindo valores padrão para mantê-la curta. */
export function toRequestListParams(state: RequestListState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.query) params.set(PARAM.query, state.query)
  if (state.status !== "all") params.set(PARAM.status, state.status)
  if (state.categoryId !== "all") params.set(PARAM.categoryId, state.categoryId)
  if (state.sort !== "recentes") params.set(PARAM.sort, state.sort)
  if (state.page > 1) params.set(PARAM.page, String(state.page))
  return params
}

/** Estado de navegação enviado ao detalhe a partir da página Solicitações. */
export interface RequestListLinkState {
  listSearch?: string
}

export const REQUEST_LIST_PATH = "/admin/solicitacoes"

/**
 * Destino do "voltar" do detalhe: a página Solicitações, com a busca, os
 * filtros e a página de onde o usuário veio, quando houver.
 */
export function getRequestListBackPath(state: unknown): string {
  const listSearch = (state as RequestListLinkState | null)?.listSearch
  return typeof listSearch === "string" && listSearch.startsWith("?")
    ? REQUEST_LIST_PATH + listSearch
    : REQUEST_LIST_PATH
}

/** Aplica mudança de busca, filtro ou ordenação, voltando para a página 1. */
export function changeRequestListFilters(
  state: RequestListState,
  change: Partial<Omit<RequestListState, "page">>,
): RequestListState {
  return { ...state, ...change, page: 1 }
}
