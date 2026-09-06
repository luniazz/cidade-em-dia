import { IDBFactory } from "fake-indexeddb"
import { describe, expect, it } from "vitest"
import {
  AttachmentServiceError,
  createAttachmentService,
} from "./attachmentService"

/** Espelha o nome real do banco definido no serviço (não exportado de propósito). */
const DB_NAME = "cidade-em-dia"

function freshFactory(): IDBFactory {
  return new IDBFactory()
}

function fixedClock(iso: string): () => Date {
  return () => new Date(iso)
}

function pngFile(name = "foto.png", bytes: number[] = [1, 2, 3, 4]): File {
  return new File([new Uint8Array(bytes)], name, { type: "image/png" })
}

/**
 * Grava um valor diretamente no object store "attachments", sem passar por
 * `save` — usado para simular registros corrompidos/incompatíveis que só
 * poderiam existir por causa de dados gravados fora do fluxo normal do
 * serviço. `key` é a chave do object store (o requestId consultado depois);
 * quando omitida, usa o `requestId` do próprio valor.
 */
async function putRawRecord(
  factory: IDBFactory,
  value: unknown,
  key?: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = factory.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains("attachments")) {
        database.createObjectStore("attachments", { keyPath: "requestId" })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction("attachments", "readwrite")
      if (key === undefined) {
        tx.objectStore("attachments").put(value)
      } else {
        tx.objectStore("attachments").put(value, key)
      }
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}

/** Conta quantas vezes `factory.open` é chamado, preservando o comportamento real. */
function countingFactory(
  factory: IDBFactory,
): {
  factory: IDBFactory
  callCount: () => number
} {
  let calls = 0
  const proxy = new Proxy(factory, {
    get(target, prop, receiver) {
      if (prop === "open") {
        return (...args: [string, number?]) => {
          calls++
          return target.open(...args)
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
  return { factory: proxy, callCount: () => calls }
}

/** Uma IDBOpenDBRequest fake cujo `onerror` dispara de forma assíncrona, simulando uma falha real de abertura. */
function createFailingOpenRequest(): IDBOpenDBRequest {
  let onerror: (() => void) | undefined
  const request = {
    error: new Error("falha simulada de abertura"),
    result: undefined,
    set onupgradeneeded(_fn: unknown) {},
    set onsuccess(_fn: unknown) {},
    set onblocked(_fn: unknown) {},
    set onerror(fn: (() => void) | undefined) {
      onerror = fn
    },
    get onerror() {
      return onerror
    },
  }
  queueMicrotask(() => onerror?.())
  return request as unknown as IDBOpenDBRequest
}

/** Factory que falha na primeira chamada de `open` e funciona normalmente depois. */
function flakyOnceFactory(factory: IDBFactory): IDBFactory {
  let shouldFail = true
  return new Proxy(factory, {
    get(target, prop, receiver) {
      if (prop === "open") {
        return (...args: [string, number?]) => {
          if (shouldFail) {
            shouldFail = false
            return createFailingOpenRequest()
          }
          return target.open(...args)
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}

describe("initialize", () => {
  it("cria o banco e o object store", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await service.initialize()

    const raw = await service.getByRequestId("inexistente")
    expect(raw).toBeNull()
  })

  it("initialize repetido é seguro", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await service.initialize()
    await expect(service.initialize()).resolves.toBeUndefined()
  })

  it("inicializações concorrentes compartilham uma única tentativa de abertura", async () => {
    const { factory, callCount } = countingFactory(freshFactory())
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await Promise.all([
      service.initialize(),
      service.initialize(),
      service.getByRequestId("x"),
    ])

    expect(callCount()).toBe(1)
  })

  it("uma primeira tentativa pode falhar, o cache é invalidado e uma tentativa posterior funciona", async () => {
    const realFactory = freshFactory()
    const flaky = flakyOnceFactory(realFactory)
    const service = createAttachmentService({ getIndexedDB: () => flaky })

    await expect(service.initialize()).rejects.toMatchObject({
      code: "storage-unavailable",
    })

    // A falha não deixou uma Promise rejeitada presa em cache: esta segunda
    // chamada dispara uma nova tentativa de abertura, que funciona.
    await expect(service.initialize()).resolves.toBeUndefined()
    await expect(service.getByRequestId("qualquer")).resolves.toBeNull()
  })

  it("onversionchange fecha e invalida a conexão; uma utilização posterior consegue reabrir o banco", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await service.initialize()

    // Simula outro contexto pedindo uma versão maior do mesmo banco — isso
    // dispara "versionchange" na conexão que o serviço mantém aberta.
    const bumped = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(DB_NAME, 2)
      request.onupgradeneeded = () => {}
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error("blocked"))
    })
    bumped.close()

    // Reseta o banco para um estado limpo: o objetivo aqui é comprovar que
    // uma chamada seguinte do serviço consegue reabrir, não testar migração
    // de versão.
    await new Promise<void>((resolve, reject) => {
      const del = factory.deleteDatabase(DB_NAME)
      del.onsuccess = () => resolve()
      del.onerror = () => reject(del.error)
    })

    // Se o cache não tivesse sido invalidado pelo onversionchange, esta
    // chamada reutilizaria a conexão fechada e falharia.
    await expect(service.getByRequestId("qualquer")).resolves.toBeNull()
  })
})

describe("save / getByRequestId", () => {
  it("preserva bytes, nome, type e size do Blob", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({
      getIndexedDB: () => factory,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
    })

    const file = pngFile("problema.png", [10, 20, 30])
    await service.save("req-1", file)

    const record = await service.getByRequestId("req-1")
    expect(record).not.toBeNull()
    expect(record?.fileName).toBe("problema.png")
    expect(record?.blob.type).toBe("image/png")
    expect(record?.blob.size).toBe(3)
    const bytes = new Uint8Array(await record!.blob.arrayBuffer())
    expect(Array.from(bytes)).toEqual([10, 20, 30])
  })

  it("createdAt é ISO e determinístico com o relógio injetado", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({
      getIndexedDB: () => factory,
      now: fixedClock("2026-01-01T00:00:00.000Z"),
    })

    const saved = await service.save("req-1", pngFile())
    expect(saved.createdAt).toBe("2026-01-01T00:00:00.000Z")

    const record = await service.getByRequestId("req-1")
    expect(record?.createdAt).toBe("2026-01-01T00:00:00.000Z")
  })

  it("get para requestId ausente retorna null", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await expect(service.getByRequestId("nao-existe")).resolves.toBeNull()
  })

  it("um segundo save no mesmo requestId substitui o primeiro", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await service.save("req-1", pngFile("primeira.png", [1]))
    await service.save("req-1", pngFile("segunda.png", [2, 2]))

    const record = await service.getByRequestId("req-1")
    expect(record?.fileName).toBe("segunda.png")
    expect(record?.blob.size).toBe(2)
  })

  it("save revalida o arquivo e rejeita com invalid-file", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    const invalid = new File([new Uint8Array([1])], "arquivo.pdf", {
      type: "application/pdf",
    })

    await expect(service.save("req-1", invalid)).rejects.toMatchObject({
      code: "invalid-file",
    })
    await expect(service.getByRequestId("req-1")).resolves.toBeNull()
  })

  it("registro malformado no banco gera storage-read-failed, não null", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    // Grava um objeto que não corresponde ao formato esperado, diretamente
    // via IndexedDB, sem passar por `save`. Um registro corrompido não é
    // "ausência normal" (null) — é uma falha de leitura.
    await putRawRecord(factory, { requestId: "malformado" })

    await expect(service.getByRequestId("malformado")).rejects.toMatchObject({
      code: "storage-read-failed",
    })
  })

  it("createdAt inválido (não ISO) gera storage-read-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    await putRawRecord(factory, {
      requestId: "req-1",
      blob: pngFile(),
      fileName: "foto.png",
      createdAt: "ontem",
    })

    await expect(service.getByRequestId("req-1")).rejects.toMatchObject({
      code: "storage-read-failed",
    })
  })

  it("createdAt ISO válido é aceito", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    await putRawRecord(factory, {
      requestId: "req-1",
      blob: pngFile(),
      fileName: "foto.png",
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    await expect(service.getByRequestId("req-1")).resolves.toMatchObject({
      requestId: "req-1",
      fileName: "foto.png",
    })
  })

  it("fileName vazio gera storage-read-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    await putRawRecord(factory, {
      requestId: "req-1",
      blob: pngFile(),
      fileName: "   ",
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    await expect(service.getByRequestId("req-1")).rejects.toMatchObject({
      code: "storage-read-failed",
    })
  })

  it("Blob com MIME inválido gera storage-read-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    await putRawRecord(factory, {
      requestId: "req-1",
      blob: new Blob([new Uint8Array([1, 2, 3])], { type: "application/pdf" }),
      fileName: "foto.pdf",
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    await expect(service.getByRequestId("req-1")).rejects.toMatchObject({
      code: "storage-read-failed",
    })
  })

  it("Blob vazio gera storage-read-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    await putRawRecord(factory, {
      requestId: "req-1",
      blob: new Blob([], { type: "image/png" }),
      fileName: "foto.png",
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    await expect(service.getByRequestId("req-1")).rejects.toMatchObject({
      code: "storage-read-failed",
    })
  })

  it("Blob acima do limite de 5 MiB gera storage-read-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    await putRawRecord(factory, {
      requestId: "req-1",
      blob: new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
        type: "image/png",
      }),
      fileName: "foto.png",
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    await expect(service.getByRequestId("req-1")).rejects.toMatchObject({
      code: "storage-read-failed",
    })
  })
})

describe("deleteByRequestId", () => {
  it("remove o registro existente", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await service.save("req-1", pngFile())
    await service.deleteByRequestId("req-1")

    await expect(service.getByRequestId("req-1")).resolves.toBeNull()
  })

  it("delete de requestId ausente não falha", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })

    await expect(
      service.deleteByRequestId("nunca-existiu"),
    ).resolves.toBeUndefined()
  })
})

describe("tratamento de erros", () => {
  it("indisponibilidade de IndexedDB gera storage-unavailable", async () => {
    const service = createAttachmentService({ getIndexedDB: () => undefined })

    await expect(service.initialize()).rejects.toMatchObject({
      code: "storage-unavailable",
    })
  })

  it("falha de leitura é mapeada para storage-read-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    // Uma chave inválida faz `IDBObjectStore.get` lançar de forma síncrona,
    // simulando uma falha real de leitura de um jeito viável com
    // fake-indexeddb (que não tem injeção de falhas nativa).
    await expect(
      service.getByRequestId(undefined as unknown as string),
    ).rejects.toMatchObject({ code: "storage-read-failed" })
  })

  it("falha de escrita é mapeada para storage-write-failed", async () => {
    const factory = freshFactory()
    const service = createAttachmentService({ getIndexedDB: () => factory })
    await service.initialize()

    // `requestId` inválido como keyPath faz `IDBObjectStore.put` lançar de
    // forma síncrona, simulando uma falha real de escrita.
    await expect(
      service.save(undefined as unknown as string, pngFile()),
    ).rejects.toMatchObject({ code: "storage-write-failed" })
  })

  it("AttachmentServiceError é uma instância de Error com nome e código próprios", () => {
    const error = new AttachmentServiceError(
      "invalid-file",
      "mensagem de teste",
    )
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("AttachmentServiceError")
    expect(error.code).toBe("invalid-file")
    expect(error.message).toBe("mensagem de teste")
  })
})
