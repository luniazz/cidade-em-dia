import { describe, expect, it } from "vitest"
import { REQUEST_CATEGORIES } from "../domain/requests"
import {
  RequestServiceError,
  createRequestService,
  type StorageLike,
} from "./requestService"

function createFakeStorage(initial?: Record<string, string>): StorageLike {
  const store = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

function fixedClock(iso: string): () => Date {
  return () => new Date(iso)
}

function sequentialIdFactory(prefix = "test-id"): () => string {
  let counter = 0
  return () => `${prefix}-${++counter}`
}

const STORAGE_KEY = "cidade-em-dia:requests:v1"

function createStoredRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "stored-id",
    protocol: "HGV-2026-00001",
    categoryId: "buracos-vias",
    address: "Rua de Teste, 10",
    description: "Descrição válida para o registro armazenado.",
    date: "2026-01-01",
    status: "recebida",
    timeline: [{ status: "recebida", occurredAt: "2026-01-01T12:00:00.000Z" }],
    ...overrides,
  }
}

describe("initialize", () => {
  it("grava a seed quando a chave está ausente", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({ storage })

    await service.initialize()

    const raw = storage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed).toHaveLength(100)
  })

  it("o total inicial é 100 e segue a distribuição 32/27/18/13/10", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({ storage })

    const all = await service.getAll()
    expect(all).toHaveLength(100)

    const expected: Record<string, number> = {
      "buracos-vias": 32,
      "iluminacao-publica": 27,
      "descarte-irregular": 18,
      "poda-arvores": 13,
      sinalizacao: 10,
    }
    for (const category of REQUEST_CATEGORIES) {
      const count = all.filter((r) => r.categoryId === category.id).length
      expect(count).toBe(expected[category.id])
    }
  })

  it("preserva os protocolos de demonstração", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({ storage })

    for (const protocol of [
      "HGV-2026-00120",
      "HGV-2026-00121",
      "HGV-2026-00122",
      "HGV-2026-00123",
      "HGV-2026-00124",
      "HGV-2026-00125",
    ]) {
      const found = await service.getByProtocol(protocol)
      expect(found).not.toBeNull()
    }
  })

  it("não reaplica a seed em uma segunda inicialização", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-01-01T00:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    await service.create({
      categoryId: "buracos-vias",
      address: "Rua Nova, 1",
      description: "Descrição de teste com detalhes suficientes.",
    })
    await service.initialize()
    await service.initialize()

    const all = await service.getAll()
    expect(all).toHaveLength(101)
  })

  it("uma lista persistida vazia ([]) não recebe a seed", async () => {
    const storage = createFakeStorage({ [STORAGE_KEY]: "[]" })
    const service = createRequestService({ storage })

    const all = await service.getAll()
    expect(all).toEqual([])
  })

  it("persiste entre instâncias diferentes que usam o mesmo storage fake", async () => {
    const storage = createFakeStorage()
    const serviceA = createRequestService({
      storage,
      now: fixedClock("2026-01-01T00:00:00.000Z"),
      generateId: sequentialIdFactory("a"),
    })
    await serviceA.create({
      categoryId: "sinalizacao",
      address: "Rua Compartilhada, 99",
      description: "Descrição válida com mais de dez caracteres.",
    })

    const serviceB = createRequestService({ storage })
    const all = await serviceB.getAll()
    expect(all).toHaveLength(101)
    expect(all.some((r) => r.address === "Rua Compartilhada, 99")).toBe(true)
  })
})

describe("getAll / getByProtocol", () => {
  it("getByProtocol normaliza espaços e diferença de maiúsculas/minúsculas", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({ storage })

    const found = await service.getByProtocol("  hgv-2026-00125  ")
    expect(found).not.toBeNull()
    expect(found?.protocol).toBe("HGV-2026-00125")
  })

  it("getByProtocol retorna null para protocolo inexistente", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({ storage })

    const found = await service.getByProtocol("HGV-2026-99999")
    expect(found).toBeNull()
  })
})

describe("create", () => {
  it("cria uma solicitação com status inicial recebida e um evento inicial", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:30:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    const created = await service.create({
      categoryId: "poda-arvores",
      address: "Rua das Árvores, 42",
      description: "Árvore com galhos ameaçando a fiação elétrica.",
    })

    expect(created.status).toBe("recebida")
    expect(created.timeline).toEqual([
      { status: "recebida", occurredAt: "2026-09-05T10:30:00.000Z" },
    ])
    expect(created.date).toBe("2026-09-05")
  })

  it("gera HGV-2026-00126 como primeiro protocolo criado sobre a seed proposta", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    const created = await service.create({
      categoryId: "buracos-vias",
      address: "Avenida Central, 1000",
      description: "Buraco grande próximo ao cruzamento principal.",
    })

    expect(created.protocol).toBe("HGV-2026-00126")
  })

  it("gera o 101º registro corretamente após a seed de 100", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    await service.create({
      categoryId: "buracos-vias",
      address: "Avenida Central, 1000",
      description: "Buraco grande próximo ao cruzamento principal.",
    })

    const all = await service.getAll()
    expect(all).toHaveLength(101)
  })

  it("usa a função de id injetada", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: () => "id-fixo-de-teste",
    })

    const created = await service.create({
      categoryId: "sinalizacao",
      address: "Rua da Sinalização, 10",
      description: "Placa de sinalização derrubada por veículo.",
    })

    expect(created.id).toBe("id-fixo-de-teste")
  })

  it("gera protocolos únicos em criações sucessivas", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    const first = await service.create({
      categoryId: "sinalizacao",
      address: "Rua Um, 1",
      description: "Primeira solicitação de teste válida.",
    })
    const second = await service.create({
      categoryId: "sinalizacao",
      address: "Rua Dois, 2",
      description: "Segunda solicitação de teste válida.",
    })

    expect(first.protocol).not.toBe(second.protocol)
  })

  it("a sequência do protocolo é isolada por ano", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2027-01-15T00:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    const created = await service.create({
      categoryId: "descarte-irregular",
      address: "Rua do Ano Novo, 1",
      description: "Descarte irregular identificado no início do ano.",
    })

    expect(created.protocol).toBe("HGV-2027-00001")
  })

  it("falha com erro claro ao atingir o limite de 99999 e não persiste registro parcial", async () => {
    const existing = [
      {
        id: "limite-1",
        protocol: "HGV-2026-99999",
        categoryId: "sinalizacao",
        address: "Rua do Limite, 1",
        description: "Registro que já ocupa a última sequência do ano.",
        date: "2026-01-01",
        status: "recebida",
        timeline: [
          { status: "recebida", occurredAt: "2026-01-01T00:00:00.000Z" },
        ],
      },
    ]
    const storage = createFakeStorage({
      [STORAGE_KEY]: JSON.stringify(existing),
    })
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    await expect(
      service.create({
        categoryId: "sinalizacao",
        address: "Rua Além do Limite, 2",
        description: "Essa criação não deveria ser persistida.",
      }),
    ).rejects.toMatchObject({ code: "protocol-exhausted" })

    const all = await service.getAll()
    expect(all).toHaveLength(1)
  })

  it("não inclui foto: nenhuma Data URL é criada ou persistida pelo serviço", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    const created = await service.create({
      categoryId: "poda-arvores",
      address: "Rua Sem Foto, 1",
      description: "Solicitação criada sem qualquer imagem anexada.",
    })

    // A seed contém um registro de demonstração com foto: a verificação
    // precisa mirar especificamente no registro recém-criado, não em toda a
    // string persistida.
    expect(created.photo).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(created, "photo")).toBe(false)

    const all = await service.getAll()
    const persisted = all.find((r) => r.id === created.id)
    expect(persisted?.photo).toBeUndefined()
  })
})

describe("updateStatus", () => {
  async function setupWithOneCreated() {
    const storage = createFakeStorage()
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })
    const created = await service.create({
      categoryId: "buracos-vias",
      address: "Rua de Teste, 1",
      description: "Descrição válida para os testes de atualização.",
    })
    return { storage, service, created }
  }

  it("acrescenta um evento ao mudar de status", async () => {
    const { service, created } = await setupWithOneCreated()

    const updated = await service.updateStatus(created.protocol, {
      status: "analise",
    })

    expect(updated.status).toBe("analise")
    expect(updated.timeline).toHaveLength(2)
    expect(updated.timeline[1].status).toBe("analise")
  })

  it("inclui a observação, já com trim aplicado, no evento acrescentado", async () => {
    const { service, created } = await setupWithOneCreated()

    const updated = await service.updateStatus(created.protocol, {
      status: "analise",
      note: "  Equipe de vistoria a caminho.  ",
    })

    expect(updated.timeline[1].note).toBe("Equipe de vistoria a caminho.")
  })

  it("mesmo status com observação não vazia acrescenta um novo evento", async () => {
    const { service, created } = await setupWithOneCreated()

    const updated = await service.updateStatus(created.protocol, {
      status: "recebida",
      note: "Reforço: aguardando equipe.",
    })

    expect(updated.timeline).toHaveLength(2)
    expect(updated.timeline[1]).toEqual({
      status: "recebida",
      occurredAt: expect.any(String),
      note: "Reforço: aguardando equipe.",
    })
  })

  it("mesmo status sem observação não acrescenta evento vazio nem persiste", async () => {
    const { storage, service, created } = await setupWithOneCreated()
    const rawBefore = storage.getItem(STORAGE_KEY)

    const updated = await service.updateStatus(created.protocol, {
      status: "recebida",
    })

    expect(updated.timeline).toHaveLength(1)
    expect(storage.getItem(STORAGE_KEY)).toBe(rawBefore)
  })

  it("mesmo status com observação composta apenas por espaços não acrescenta evento", async () => {
    const { service, created } = await setupWithOneCreated()

    const updated = await service.updateStatus(created.protocol, {
      status: "recebida",
      note: "     ",
    })

    expect(updated.timeline).toHaveLength(1)
  })

  it("permite regressão para uma etapa anterior sem bloqueio", async () => {
    const { service, created } = await setupWithOneCreated()

    await service.updateStatus(created.protocol, { status: "analise" })
    await service.updateStatus(created.protocol, { status: "programada" })
    const regressed = await service.updateStatus(created.protocol, {
      status: "analise",
    })

    expect(regressed.status).toBe("analise")
    expect(regressed.timeline.map((e) => e.status)).toEqual([
      "recebida",
      "analise",
      "programada",
      "analise",
    ])
  })

  it("preserva eventos posteriores já ocorridos ao regredir o status", async () => {
    const { service, created } = await setupWithOneCreated()

    await service.updateStatus(created.protocol, { status: "analise" })
    await service.updateStatus(created.protocol, { status: "programada" })
    const regressed = await service.updateStatus(created.protocol, {
      status: "recebida",
    })

    // Os três primeiros eventos (recebida, analise, programada) continuam
    // presentes e intactos, mesmo após o status regredir.
    expect(regressed.timeline[0].status).toBe("recebida")
    expect(regressed.timeline[1].status).toBe("analise")
    expect(regressed.timeline[2].status).toBe("programada")
    expect(regressed.timeline[3].status).toBe("recebida")
    expect(regressed.timeline).toHaveLength(4)
  })

  it("permite múltiplos eventos do mesmo status e preserva a ordem cronológica", async () => {
    const { service, created } = await setupWithOneCreated()

    await service.updateStatus(created.protocol, {
      status: "analise",
      note: "Primeira análise.",
    })
    await service.updateStatus(created.protocol, {
      status: "analise",
      note: "Segunda análise, reaberta.",
    })

    const all = await service.getAll()
    const found = all.find((r) => r.protocol === created.protocol)
    expect(found?.timeline.filter((e) => e.status === "analise")).toHaveLength(
      2,
    )
    expect(found?.timeline.map((e) => e.note)).toEqual([
      undefined,
      "Primeira análise.",
      "Segunda análise, reaberta.",
    ])
  })

  it("lança erro claro para protocolo inexistente", async () => {
    const storage = createFakeStorage()
    const service = createRequestService({ storage })

    await expect(
      service.updateStatus("HGV-2026-77777", {
        status: "analise",
      }),
    ).rejects.toMatchObject({ code: "not-found" })
  })
})

describe("tratamento de armazenamento inválido", () => {
  it("JSON inválido: não sobrescreve e retorna erro claro", async () => {
    const storage = createFakeStorage({ [STORAGE_KEY]: "{ isso não é json" })
    const service = createRequestService({ storage })

    await expect(service.initialize()).rejects.toMatchObject({
      code: "storage-corrupted",
    })
    expect(storage.getItem(STORAGE_KEY)).toBe("{ isso não é json")
  })

  it("estrutura incompatível: não sobrescreve e retorna erro claro", async () => {
    const incompatible = JSON.stringify([{ foo: "bar" }])
    const storage = createFakeStorage({ [STORAGE_KEY]: incompatible })
    const service = createRequestService({ storage })

    await expect(service.getAll()).rejects.toMatchObject({
      code: "storage-corrupted",
    })
    expect(storage.getItem(STORAGE_KEY)).toBe(incompatible)
  })

  it.each([
    ["timeline vazia", createStoredRequest({ timeline: [] })],
    [
      "instante sem horário e fuso explícitos",
      createStoredRequest({
        timeline: [{ status: "recebida", occurredAt: "2026-01-01" }],
      }),
    ],
    [
      "status atual diferente do último evento",
      createStoredRequest({ status: "analise" }),
    ],
    [
      "eventos fora de ordem cronológica",
      createStoredRequest({
        status: "analise",
        timeline: [
          { status: "recebida", occurredAt: "2026-01-02T12:00:00.000Z" },
          { status: "analise", occurredAt: "2026-01-01T12:00:00.000Z" },
        ],
      }),
    ],
  ])("rejeita %s sem sobrescrever o armazenamento", async (_, request) => {
    const incompatible = JSON.stringify([request])
    const storage = createFakeStorage({ [STORAGE_KEY]: incompatible })
    const service = createRequestService({ storage })

    await expect(service.getAll()).rejects.toMatchObject({
      code: "storage-corrupted",
    })
    expect(storage.getItem(STORAGE_KEY)).toBe(incompatible)
  })

  it("falha de leitura retorna erro claro", async () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("leitura indisponível")
      },
      setItem: () => {},
    }
    const service = createRequestService({ storage })

    await expect(service.initialize()).rejects.toMatchObject({
      code: "storage-unavailable",
    })
  })

  it("falha de escrita retorna erro claro", async () => {
    const storage: StorageLike = {
      getItem: () => "[]",
      setItem: () => {
        throw new Error("escrita indisponível")
      },
    }
    const service = createRequestService({
      storage,
      now: fixedClock("2026-09-05T10:00:00.000Z"),
      generateId: sequentialIdFactory(),
    })

    await expect(
      service.create({
        categoryId: "sinalizacao",
        address: "Rua Sem Espaço, 1",
        description: "Essa escrita deveria falhar propositalmente.",
      }),
    ).rejects.toMatchObject({ code: "storage-write-failed" })
  })

  it("retentativa após falha de inicialização", async () => {
    let shouldFail = true
    const store = new Map<string, string>()
    const storage: StorageLike = {
      getItem: (key) => {
        if (shouldFail) throw new Error("indisponível na primeira tentativa")
        return store.get(key) ?? null
      },
      setItem: (key, value) => {
        store.set(key, value)
      },
    }
    const service = createRequestService({ storage })

    await expect(service.initialize()).rejects.toMatchObject({
      code: "storage-unavailable",
    })

    shouldFail = false
    await expect(service.initialize()).resolves.toBeUndefined()
    const all = await service.getAll()
    expect(all).toHaveLength(100)
  })
})

describe("RequestServiceError", () => {
  it("é uma instância de Error com nome e código próprios", () => {
    const error = new RequestServiceError("not-found", "mensagem de teste")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("RequestServiceError")
    expect(error.code).toBe("not-found")
    expect(error.message).toBe("mensagem de teste")
  })
})
