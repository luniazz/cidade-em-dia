import type {
  CreateUrbanRequestInput,
  RequestTimelineEvent,
  UpdateStatusInput,
  UrbanRequest,
} from "../domain/requests"
import { isRequestCategoryId, isRequestStatus } from "../domain/requests"
import {
  formatDateOnlyPtBR,
  getLocalDateOnly,
  isIsoInstant,
} from "../utils/date"
import { generateId } from "../utils/id"
import {
  formatProtocol,
  getNextSequence,
  isValidProtocol,
} from "../utils/protocol"
import { seedRequests } from "../data/seedRequests"

/**
 * Camada de persistência local das solicitações (`localStorage`). Os
 * componentes e páginas não devem acessar `localStorage` diretamente: toda a
 * leitura, escrita, validação e geração de protocolo/id passam por aqui.
 *
 * A API pública é assíncrona mesmo o `localStorage` sendo síncrono, para que
 * as telas já tratem loading/sucesso/erro como fariam com uma API real, e
 * para que uma futura troca por IndexedDB ou uma API HTTP não exija
 * reescrever os componentes.
 */

const STORAGE_KEY = "cidade-em-dia:requests:v1"

/** Superfície mínima de armazenamento exigida pelo serviço, injetável em testes. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type RequestServiceErrorCode = "storage-unavailable" | "storage-write-failed" | "storage-corrupted" | "not-found" | "protocol-exhausted" | "id-generation-failed"

/** Erro tipado do serviço. Não é um sistema global de erros — apenas um envelope com código + mensagem em pt-BR. */
export class RequestServiceError extends Error {
  readonly code: RequestServiceErrorCode

  constructor(code: RequestServiceErrorCode, message: string) {
    super(message)
    this.name = "RequestServiceError"
    this.code = code
  }
}

export interface RequestService {
  initialize(): Promise<void>
  getAll(): Promise<UrbanRequest[]>
  getByProtocol(protocol: string): Promise<UrbanRequest | null>
  create(input: CreateUrbanRequestInput): Promise<UrbanRequest>
  updateStatus(
    protocol: string,
    input: UpdateStatusInput,
  ): Promise<UrbanRequest>
}

export interface RequestServiceDeps {
  storage: StorageLike
  /** Função de relógio injetável para testes determinísticos. */
  now?: () => Date
  /** Função de geração de id injetável para testes determinísticos. */
  generateId?: () => string
}

function isRequestTimelineEvent(value: unknown): value is RequestTimelineEvent {
  if (typeof value !== "object" || value === null) return false
  const event = value as Record<string, unknown>

  if (typeof event.status !== "string" || !isRequestStatus(event.status)) {
    return false
  }
  if (typeof event.occurredAt !== "string" || !isIsoInstant(event.occurredAt)) {
    return false
  }
  if (event.note !== undefined && typeof event.note !== "string") {
    return false
  }

  return true
}

/** Guarda estrutural de um `UrbanRequest` lido do `localStorage` (nunca um `as UrbanRequest[]` direto de um `JSON.parse`). */
function isStoredUrbanRequest(value: unknown): value is UrbanRequest {
  if (typeof value !== "object" || value === null) return false
  const request = value as Record<string, unknown>

  if (typeof request.id !== "string" || request.id.length === 0) return false
  if (
    typeof request.protocol !== "string" ||
    !isValidProtocol(request.protocol)
  ) {
    return false
  }
  if (
    typeof request.categoryId !== "string" ||
    !isRequestCategoryId(request.categoryId)
  ) {
    return false
  }
  if (typeof request.address !== "string" || request.address.length === 0) {
    return false
  }
  if (
    typeof request.description !== "string" ||
    request.description.length === 0
  ) {
    return false
  }
  if (
    request.reference !== undefined &&
    typeof request.reference !== "string"
  ) {
    return false
  }
  if (request.name !== undefined && typeof request.name !== "string") {
    return false
  }
  if (request.email !== undefined && typeof request.email !== "string") {
    return false
  }
  if (
    typeof request.date !== "string" ||
    formatDateOnlyPtBR(request.date) === null
  ) {
    return false
  }
  if (typeof request.status !== "string" || !isRequestStatus(request.status)) {
    return false
  }
  if (request.photo !== undefined && typeof request.photo !== "string") {
    return false
  }
  if (
    request.adminNote !== undefined &&
    typeof request.adminNote !== "string"
  ) {
    return false
  }
  if (
    !Array.isArray(request.timeline) ||
    request.timeline.length === 0 ||
    !request.timeline.every(isRequestTimelineEvent)
  ) {
    return false
  }
  const timeline = request.timeline as RequestTimelineEvent[]
  if (timeline[timeline.length - 1].status !== request.status) return false
  for (let index = 1; index < timeline.length; index += 1) {
    const previousTime = Date.parse(timeline[index - 1].occurredAt)
    const currentTime = Date.parse(timeline[index].occurredAt)
    if (currentTime < previousTime) return false
  }

  return true
}

/**
 * Cria uma instância do serviço com dependências injetáveis (storage,
 * relógio e gerador de id), permitindo testes determinísticos com um
 * armazenamento fake em memória — sem jsdom e sem mock global de
 * `localStorage`.
 */
export function createRequestService(deps: RequestServiceDeps): RequestService {
  const { storage } = deps
  const now = deps.now ?? (() => new Date())
  const idFactory = deps.generateId ?? generateId

  let initPromise: Promise<void> | null = null

  function readRaw(): string | null {
    try {
      return storage.getItem(STORAGE_KEY)
    } catch {
      throw new RequestServiceError(
        "storage-unavailable",
        "Não foi possível acessar o armazenamento local do navegador.",
      )
    }
  }

  function parseStoredList(raw: string): UrbanRequest[] {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new RequestServiceError(
        "storage-corrupted",
        "Os dados salvos localmente estão corrompidos (formato JSON inválido).",
      )
    }

    if (!Array.isArray(parsed) || !parsed.every(isStoredUrbanRequest)) {
      throw new RequestServiceError(
        "storage-corrupted",
        "Os dados salvos localmente têm um formato inesperado.",
      )
    }

    return parsed
  }

  function readAll(): UrbanRequest[] {
    const raw = readRaw()
    if (raw === null) return []
    return parseStoredList(raw)
  }

  function persistAll(requests: UrbanRequest[]): void {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(requests))
    } catch {
      throw new RequestServiceError(
        "storage-write-failed",
        "Não foi possível salvar os dados no armazenamento local.",
      )
    }
  }

  async function doInitialize(): Promise<void> {
    const raw = readRaw()
    if (raw === null) {
      // Chave ausente: primeira vez que a aplicação roda neste navegador.
      persistAll([...seedRequests])
      return
    }
    // Uma lista persistida vazia ("[]") já representa armazenamento
    // existente e não deve receber a seed novamente. Valida o conteúdo já
    // aqui para que uma corrupção seja detectada no boot da aplicação, e não
    // apenas na primeira leitura feita pela UI.
    parseStoredList(raw)
  }

  // `initialize` é idempotente: chamadas concorrentes compartilham a mesma
  // promise, e uma falha permite nova tentativa na próxima chamada (não fica
  // presa em um estado de erro permanente). Os demais métodos chamam esta
  // mesma função internamente, então são seguros mesmo se usados antes do
  // boot explícito do App.
  function ensureInitialized(): Promise<void> {
    if (!initPromise) {
      initPromise = doInitialize().catch((error: unknown) => {
        initPromise = null
        throw error
      })
    }
    return initPromise
  }

  function findIndexByProtocol(
    requests: UrbanRequest[],
    protocol: string,
  ): number {
    const normalized = protocol.trim().toUpperCase()
    return requests.findIndex((r) => r.protocol.toUpperCase() === normalized)
  }

  async function initialize(): Promise<void> {
    await ensureInitialized()
  }

  async function getAll(): Promise<UrbanRequest[]> {
    await ensureInitialized()
    return readAll()
  }

  async function getByProtocol(protocol: string): Promise<UrbanRequest | null> {
    await ensureInitialized()
    const all = readAll()
    const index = findIndexByProtocol(all, protocol)
    return index === -1 ? null : all[index]
  }

  async function create(input: CreateUrbanRequestInput): Promise<UrbanRequest> {
    await ensureInitialized()
    const all = readAll()

    const currentDate = now()
    const year = currentDate.getFullYear()

    let protocol: string
    try {
      // Não há resolução de concorrência entre abas/usuários nesta etapa:
      // a sequência é calculada a partir da última leitura do storage, o
      // que pode colidir em uma escrita simultânea de duas abas. Um cenário
      // aceitável para o escopo atual (frontend-only, um único operador).
      const sequence = getNextSequence(
        all.map((r) => r.protocol),
        year,
      )
      protocol = formatProtocol(year, sequence)
    } catch {
      throw new RequestServiceError(
        "protocol-exhausted",
        `Não foi possível gerar um novo protocolo para o ano ${year}: limite de solicitações para o ano foi atingido.`,
      )
    }

    let id: string
    try {
      id = idFactory()
    } catch {
      throw new RequestServiceError(
        "id-generation-failed",
        "Não foi possível gerar um identificador seguro para a solicitação.",
      )
    }

    const occurredAt = currentDate.toISOString()
    const request: UrbanRequest = {
      id,
      protocol,
      categoryId: input.categoryId,
      address: input.address,
      description: input.description,
      reference: input.reference,
      name: input.name,
      email: input.email,
      date: getLocalDateOnly(currentDate),
      status: "recebida",
      timeline: [{ status: "recebida", occurredAt }],
    }

    persistAll([...all, request])
    return request
  }

  async function updateStatus(
    protocol: string,
    input: UpdateStatusInput,
  ): Promise<UrbanRequest> {
    await ensureInitialized()
    const all = readAll()
    const index = findIndexByProtocol(all, protocol)

    if (index === -1) {
      throw new RequestServiceError(
        "not-found",
        `Solicitação com protocolo "${protocol}" não foi encontrada.`,
      )
    }

    const current = all[index]
    const note = input.note?.trim() || undefined
    const isSameStatus = input.status === current.status

    if (isSameStatus && !note) {
      // Mesmo status sem observação nova: nada muda. Não cria evento vazio
      // nem persiste, e devolve o registro atual para que a UI não simule
      // uma confirmação de alteração que não ocorreu.
      return current
    }

    const occurredAt = now().toISOString()
    // A timeline é histórico, não um espelho do status atual: eventos
    // anteriores nunca são removidos ou reconstruídos, o novo evento é
    // sempre acrescentado ao final, e o mesmo status pode se repetir (ex.:
    // uma regressão para uma etapa anterior seguida de novo avanço).
    const updated: UrbanRequest = {
      ...current,
      status: input.status,
      timeline: [
        ...current.timeline,
        { status: input.status, occurredAt, note },
      ],
    }

    const updatedAll = [...all]
    updatedAll[index] = updated
    persistAll(updatedAll)
    return updated
  }

  return { initialize, getAll, getByProtocol, create, updateStatus }
}

const localStorageAdapter: StorageLike = {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key)
  },
  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value)
  },
}

/**
 * Instância usada pela aplicação real, adaptando `window.localStorage`. Não
 * toca `window` na importação do módulo — apenas quando um método é
 * efetivamente chamado — para que o arquivo possa ser importado com
 * segurança em ambiente Node (ex.: Vitest) sem `window` definido.
 */
export const requestService: RequestService = createRequestService({
  storage: localStorageAdapter,
})
