import type { AttachmentRecord } from "../domain/attachments"
import { validateAttachmentFile } from "../domain/attachments"
import { isIsoInstant } from "../utils/date"

/**
 * Persistência local da imagem opcional de uma solicitação, em IndexedDB.
 * `requestService` continua responsável pelos dados textuais no
 * `localStorage`; este serviço é o único ponto do código de produção que
 * toca IndexedDB. A UI depende só deste contrato, nunca do banco.
 *
 * Banco: "cidade-em-dia", versão 1, com um único object store
 * "attachments" (keyPath "requestId", sem índices secundários). A ausência
 * de um registro para um `requestId` significa, por definição, que a
 * solicitação não tem foto — não é um erro.
 */

const DB_NAME = "cidade-em-dia"
const DB_VERSION = 1
const STORE_NAME = "attachments"

export type AttachmentServiceErrorCode = "invalid-file" | "storage-unavailable" | "storage-read-failed" | "storage-write-failed"

/** Erro tipado do serviço. A mensagem já é segura para mostrar ao usuário — nunca expõe DOMException ou detalhes técnicos. */
export class AttachmentServiceError extends Error {
  readonly code: AttachmentServiceErrorCode

  constructor(code: AttachmentServiceErrorCode, message: string) {
    super(message)
    this.name = "AttachmentServiceError"
    this.code = code
  }
}

export interface AttachmentService {
  initialize(): Promise<void>
  save(requestId: string, file: File): Promise<AttachmentRecord>
  getByRequestId(requestId: string): Promise<AttachmentRecord | null>
  deleteByRequestId(requestId: string): Promise<void>
}

export interface AttachmentServiceDeps {
  /**
   * Resolve a implementação de IndexedDB apenas quando uma operação é de
   * fato executada — nunca na importação do módulo. Isso permite importar
   * este arquivo com segurança em qualquer ambiente (SSR, testes) mesmo sem
   * `indexedDB` disponível, e permite testes injetarem uma `IDBFactory`
   * isolada.
   */
  getIndexedDB?: () => IDBFactory | undefined
  /** Relógio injetável para `createdAt` determinístico em teste. */
  now?: () => Date
}

/**
 * Guarda estrutural completa de um registro lido do IndexedDB. `requestId`
 * precisa bater com a chave efetivamente consultada (não só ser uma string
 * não vazia), `createdAt` reaproveita `isIsoInstant` (nenhuma segunda
 * implementação de validação ISO), e as regras de MIME/tamanho do Blob
 * reaproveitam `validateAttachmentFile` — que já aceita qualquer valor com
 * `{ type, size }`, então um `Blob` serve diretamente, sem precisar virar
 * `File` só para ser validado.
 *
 * O object store usa `keyPath: "requestId"`, então o próprio IndexedDB
 * garante `record.requestId === chave` para registros gravados normalmente.
 * A comparação permanece como defesa interna, sem ampliar a API pública do
 * módulo apenas para testar uma situação que o banco não permite produzir.
 */
function isValidStoredAttachmentRecord(
  value: unknown,
  expectedRequestId: string,
): value is AttachmentRecord {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>

  if (typeof record.requestId !== "string" || record.requestId.length === 0) {
    return false
  }
  if (record.requestId !== expectedRequestId) return false
  if (!(record.blob instanceof Blob)) return false
  if (
    typeof record.fileName !== "string" ||
    record.fileName.trim().length === 0
  ) {
    return false
  }
  if (typeof record.createdAt !== "string" || !isIsoInstant(record.createdAt)) {
    return false
  }
  if (!validateAttachmentFile(record.blob).valid) return false

  return true
}

/**
 * Cria uma instância do serviço com dependências injetáveis, permitindo
 * testes determinísticos e isolados com `fake-indexeddb` — sem jsdom e sem
 * substituir `globalThis.indexedDB` permanentemente.
 */
export function createAttachmentService(
  deps: AttachmentServiceDeps = {},
): AttachmentService {
  const getIndexedDB = deps.getIndexedDB ?? (() => globalThis.indexedDB)
  const now = deps.now ?? (() => new Date())

  // Promise compartilhada da conexão em aberto. `null` sempre que não há
  // uma tentativa em andamento nem uma conexão válida em cache — é o que
  // permite uma nova tentativa depois de uma falha.
  let dbPromise: Promise<IDBDatabase> | null = null

  function openDatabase(invalidateIfCurrent: () => void): Promise<IDBDatabase> {
    const factory = getIndexedDB()
    if (!factory) {
      return Promise.reject(
        new AttachmentServiceError(
          "storage-unavailable",
          "O armazenamento local de imagens não está disponível neste navegador.",
        ),
      )
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      let settled = false
      const request = factory.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "requestId" })
        }
      }

      request.onsuccess = () => {
        const database = request.result

        // Outro contexto (nova versão, ou outra aba abrindo uma versão
        // diferente) precisa que esta conexão seja fechada. Fechamos e
        // invalidamos o cache — uma futura operação poderá reabrir.
        database.onversionchange = () => {
          database.close()
          invalidateIfCurrent()
        }

        if (settled) {
          // Um `onblocked` ou `onerror` anterior já resolveu esta tentativa
          // (com erro). Uma conexão aberta depois disso ficaria órfã.
          database.close()
          return
        }
        settled = true
        resolve(database)
      }

      request.onerror = () => {
        if (settled) return
        settled = true
        reject(
          new AttachmentServiceError(
            "storage-unavailable",
            "Não foi possível abrir o armazenamento local de imagens.",
          ),
        )
      }

      request.onblocked = () => {
        if (settled) return
        settled = true
        reject(
          new AttachmentServiceError(
            "storage-unavailable",
            "Não foi possível abrir o armazenamento local de imagens: outra aba está bloqueando a atualização.",
          ),
        )
      }
    })
  }

  // Tentativas concorrentes compartilham esta mesma Promise (nenhuma chamada
  // adicional a `factory.open` enquanto uma tentativa está em andamento). Se
  // a tentativa falhar, o cache é limpo antes de propagar o erro, para que a
  // próxima chamada dispare uma nova tentativa em vez de reutilizar uma
  // Promise rejeitada para sempre.
  function ensureDatabase(): Promise<IDBDatabase> {
    if (!dbPromise) {
      const attempt: Promise<IDBDatabase> = openDatabase(() => {
        if (dbPromise === attempt) {
          dbPromise = null
        }
      }).catch((error: unknown) => {
        if (dbPromise === attempt) {
          dbPromise = null
        }
        throw error
      })
      dbPromise = attempt
    }
    return dbPromise
  }

  function runInTransaction<T>(
    database: IDBDatabase,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, mode)
      const store = tx.objectStore(STORE_NAME)
      const request = action(store)
      let result: T

      request.onsuccess = () => {
        result = request.result
      }
      // A escrita só é considerada confirmada quando a transaction conclui
      // (`oncomplete`), não apenas quando o request individual tem sucesso.
      tx.oncomplete = () => resolve(result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  async function initialize(): Promise<void> {
    await ensureDatabase()
  }

  async function save(
    requestId: string,
    file: File,
  ): Promise<AttachmentRecord> {
    // Revalida sempre: `accept` no input é só uma sugestão do seletor, e a
    // tela já validou uma vez, mas o serviço não confia em quem chama.
    const validation = validateAttachmentFile(file)
    if (!validation.valid) {
      throw new AttachmentServiceError("invalid-file", validation.error.message)
    }

    let database: IDBDatabase
    try {
      database = await ensureDatabase()
    } catch (error) {
      throw error instanceof AttachmentServiceError
        ? error
        : new AttachmentServiceError(
            "storage-unavailable",
            "O armazenamento local de imagens não está disponível neste navegador.",
          )
    }

    const record: AttachmentRecord = {
      requestId,
      blob: file,
      fileName: file.name,
      createdAt: now().toISOString(),
    }

    try {
      // `put` com o mesmo `requestId` substitui o registro anterior, já que
      // "attachments" tem exatamente uma foto por solicitação.
      await runInTransaction(database, "readwrite", (store) =>
        store.put(record),
      )
    } catch {
      throw new AttachmentServiceError(
        "storage-write-failed",
        "Não foi possível salvar a foto no armazenamento local.",
      )
    }

    return record
  }

  async function getByRequestId(
    requestId: string,
  ): Promise<AttachmentRecord | null> {
    let database: IDBDatabase
    try {
      database = await ensureDatabase()
    } catch (error) {
      throw error instanceof AttachmentServiceError
        ? error
        : new AttachmentServiceError(
            "storage-unavailable",
            "O armazenamento local de imagens não está disponível neste navegador.",
          )
    }

    let raw: unknown
    try {
      raw = await runInTransaction(database, "readonly", (store) =>
        store.get(requestId),
      )
    } catch {
      throw new AttachmentServiceError(
        "storage-read-failed",
        "Não foi possível consultar a foto armazenada localmente.",
      )
    }

    // Chave ausente é o único caso que representa "sem foto" de verdade.
    if (raw === undefined) return null

    // Existe um valor gravado, mas ele não corresponde a um AttachmentRecord
    // válido: isso é dado corrompido/incompatível, não ausência normal — a
    // UI precisa poder distinguir os dois casos.
    if (!isValidStoredAttachmentRecord(raw, requestId)) {
      throw new AttachmentServiceError(
        "storage-read-failed",
        "Não foi possível consultar a foto armazenada localmente.",
      )
    }

    return raw
  }

  async function deleteByRequestId(requestId: string): Promise<void> {
    let database: IDBDatabase
    try {
      database = await ensureDatabase()
    } catch (error) {
      throw error instanceof AttachmentServiceError
        ? error
        : new AttachmentServiceError(
            "storage-unavailable",
            "O armazenamento local de imagens não está disponível neste navegador.",
          )
    }

    try {
      // `delete` de uma chave inexistente conclui normalmente (não lança).
      await runInTransaction(database, "readwrite", (store) =>
        store.delete(requestId),
      )
    } catch {
      throw new AttachmentServiceError(
        "storage-write-failed",
        "Não foi possível remover a foto do armazenamento local.",
      )
    }
  }

  return { initialize, save, getByRequestId, deleteByRequestId }
}

/**
 * Instância usada pela aplicação real. Não resolve `globalThis.indexedDB`
 * na importação do módulo — só quando uma operação é efetivamente chamada —
 * para que o arquivo possa ser importado com segurança mesmo sem
 * `indexedDB` definido (ex.: Vitest em ambiente Node).
 */
export const attachmentService: AttachmentService = createAttachmentService()
