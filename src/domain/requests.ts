/**
 * Fonte única do domínio de solicitações do Cidade em Dia.
 *
 * O tipo é chamado `UrbanRequest` (em vez de `Request`) para não colidir com o
 * `Request` nativo da Web (usado por `fetch`). Nesta etapa este módulo contém
 * apenas tipos, catálogos e pequenos helpers puros — nenhuma camada de
 * persistência ou serviço é criada aqui.
 */

export const REQUEST_STATUSES = [
  "recebida",
  "analise",
  "programada",
  "execucao",
  "resolvida",
] as const

export type RequestStatus = typeof REQUEST_STATUSES[number]

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  recebida: "Recebida",
  analise: "Em análise",
  programada: "Programada",
  execucao: "Em execução",
  resolvida: "Resolvida",
}

export function isRequestStatus(value: string): value is RequestStatus {
  return REQUEST_STATUSES.some((status) => status === value)
}

/** Catálogo oficial de categorias. "Calçada danificada" não faz parte do escopo vigente. */
export const REQUEST_CATEGORIES = [
  { id: "buracos-vias", label: "Buracos em vias" },
  { id: "iluminacao-publica", label: "Iluminação pública" },
  { id: "descarte-irregular", label: "Descarte irregular de resíduos" },
  { id: "poda-arvores", label: "Poda de árvores" },
  { id: "sinalizacao", label: "Sinalização" },
] as const

export type RequestCategoryId = typeof REQUEST_CATEGORIES[number]["id"]

export function isRequestCategoryId(value: string): value is RequestCategoryId {
  return REQUEST_CATEGORIES.some((category) => category.id === value)
}

export function getRequestCategoryLabel(id: RequestCategoryId): string {
  const category = REQUEST_CATEGORIES.find((c) => c.id === id)
  return category ? category.label : id
}

export interface RequestTimelineEvent {
  status: RequestStatus
  /** Instante ISO 8601 em que o evento ocorreu (ex.: `new Date().toISOString()`). */
  occurredAt: string
  note?: string
}

export interface UrbanRequest {
  id: string
  protocol: string
  categoryId: RequestCategoryId
  address: string
  reference?: string
  description: string
  name?: string
  email?: string
  /** Data civil de abertura no formato YYYY-MM-DD. */
  date: string
  status: RequestStatus
  photo?: string
  timeline: RequestTimelineEvent[]
  adminNote?: string
}

/**
 * Dados aceitos para criar uma solicitação. Protocolo, id, data, status e
 * timeline são responsabilidade do `requestService`, não do formulário.
 */
export interface CreateUrbanRequestInput {
  categoryId: RequestCategoryId
  address: string
  description: string
  reference?: string
  name?: string
  email?: string
}

/**
 * Dados aceitos para registrar uma atualização de status. Não existem
 * restrições de transição: qualquer status pode suceder qualquer outro.
 */
export interface UpdateStatusInput {
  status: RequestStatus
  note?: string
}
