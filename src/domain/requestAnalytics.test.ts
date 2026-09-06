import { describe, expect, it } from "vitest"
import { deriveRequestAnalytics } from "./requestAnalytics"
import { seedRequests } from "../data/seedRequests"
import type { RequestStatus, UrbanRequest } from "./requests"

/**
 * As datas de referência dos testes são sempre construídas a partir de
 * componentes locais (`new Date(ano, mes, dia, ...)`) e nunca a partir de um
 * literal com sufixo `Z`, para que os testes produzam o mesmo resultado em
 * qualquer fuso horário de execução. O mesmo vale para os eventos de
 * timeline: o instante ISO é gerado por `.toISOString()` a partir de
 * componentes locais, nunca escrito à mão como UTC.
 */

let nextId = 0

function buildRequest(overrides: Partial<UrbanRequest> = {}): UrbanRequest {
  nextId++
  const status: RequestStatus = overrides.status ?? "recebida"
  return {
    id: `req-${nextId}`,
    protocol: `HGV-2026-${String(nextId).padStart(5, "0")}`,
    categoryId: "buracos-vias",
    address: "Rua de Teste, 100",
    description: "Descrição de teste com mais de dez caracteres.",
    date: "2026-09-01",
    status,
    timeline: [{ status, occurredAt: localInstant(2026, 9, 1) }],
    ...overrides,
  }
}

function localInstant(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): string {
  return new Date(year, month - 1, day, hour, minute, 0).toISOString()
}

describe("deriveRequestAnalytics", () => {
  it("retorna KPIs, categorias e série zerados para lista vazia", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const result = deriveRequestAnalytics([], referenceDate)

    expect(result.kpis).toEqual({
      aguardandoAtendimento: 0,
      emAtendimento: 0,
      resolvidasNoMes: 0,
      totalSolicitacoes: 0,
    })
    expect(result.categoryData).toHaveLength(5)
    expect(result.categoryData.every((entry) => entry.value === 0)).toBe(true)
    expect(result.weeklySeries).toHaveLength(7)
    expect(
      result.weeklySeries.every(
        (entry) => entry.registradas === 0 && entry.resolvidas === 0,
      ),
    ).toBe(true)
  })

  it("conta uma solicitação recebida em aguardandoAtendimento", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [buildRequest({ status: "recebida" })]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.aguardandoAtendimento).toBe(1)
  })

  it("aguardandoAtendimento conta apenas status recebida", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({ status: "recebida" }),
      buildRequest({ status: "analise" }),
      buildRequest({ status: "resolvida" }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.aguardandoAtendimento).toBe(1)
  })

  it("emAtendimento conta analise, programada e execucao", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({ status: "analise" }),
      buildRequest({ status: "programada" }),
      buildRequest({ status: "execucao" }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.emAtendimento).toBe(3)
  })

  it("resolvida não conta como emAtendimento", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [buildRequest({ status: "resolvida" })]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.emAtendimento).toBe(0)
  })

  it("totalSolicitacoes usa requests.length", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({ status: "recebida" }),
      buildRequest({ status: "resolvida" }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.totalSolicitacoes).toBe(2)
  })

  it("totalSolicitacoes aumenta após adicionar uma solicitação", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const base = Array.from({ length: 100 }, () => buildRequest())
    const withExtra = [...base, buildRequest()]
    const before = deriveRequestAnalytics(base, referenceDate)
    const after = deriveRequestAnalytics(withExtra, referenceDate)
    expect(before.kpis.totalSolicitacoes).toBe(100)
    expect(after.kpis.totalSolicitacoes).toBe(101)
  })

  it("mudança de status atual altera os KPIs de estado", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const recebida = deriveRequestAnalytics(
      [buildRequest({ status: "recebida" })],
      referenceDate,
    )
    const emAnalise = deriveRequestAnalytics(
      [buildRequest({ status: "analise" })],
      referenceDate,
    )
    expect(recebida.kpis.aguardandoAtendimento).toBe(1)
    expect(recebida.kpis.emAtendimento).toBe(0)
    expect(emAnalise.kpis.aguardandoAtendimento).toBe(0)
    expect(emAnalise.kpis.emAtendimento).toBe(1)
  })

  it("categorias aparecem na ordem oficial do catálogo, mesmo sem ocorrências", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [buildRequest({ categoryId: "sinalizacao" })]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.categoryData.map((entry) => entry.name)).toEqual([
      "Buracos em vias",
      "Iluminação pública",
      "Descarte irregular de resíduos",
      "Poda de árvores",
      "Sinalização",
    ])
    const buracos = result.categoryData.find(
      (entry) => entry.name === "Buracos em vias",
    )
    expect(buracos?.value).toBe(0)
  })

  it("distribuição por categoria da seed é 32/27/18/13/10 e o total é 100", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const result = deriveRequestAnalytics(seedRequests, referenceDate)
    expect(result.categoryData.map((entry) => entry.value)).toEqual([
      32, 27, 18, 13, 10,
    ])
    expect(result.kpis.totalSolicitacoes).toBe(100)
  })

  it("snapshot informativo: distribuição de status atual da seed (não é regra de domínio)", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const result = deriveRequestAnalytics(seedRequests, referenceDate)
    expect(result.kpis.aguardandoAtendimento).toBe(19)
    expect(result.kpis.emAtendimento).toBe(60)
  })

  it("resolução dentro do mês de referência conta em resolvidasNoMes", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          { status: "recebida", occurredAt: localInstant(2026, 9, 1) },
          { status: "resolvida", occurredAt: localInstant(2026, 9, 3) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.resolvidasNoMes).toBe(1)
  })

  it("resolução fora do mês de referência não conta em resolvidasNoMes", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          { status: "resolvida", occurredAt: localInstant(2026, 8, 20) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.resolvidasNoMes).toBe(0)
  })

  it("múltiplas resolvidas da mesma solicitação no mesmo mês contam uma vez", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          { status: "resolvida", occurredAt: localInstant(2026, 9, 2) },
          { status: "programada", occurredAt: localInstant(2026, 9, 4) },
          { status: "resolvida", occurredAt: localInstant(2026, 9, 10) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.resolvidasNoMes).toBe(1)
  })

  it("regressão de status posterior não remove a resolução mensal histórica", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "analise",
        timeline: [
          { status: "resolvida", occurredAt: localInstant(2026, 9, 2) },
          { status: "analise", occurredAt: localInstant(2026, 9, 4) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.resolvidasNoMes).toBe(1)
    expect(result.kpis.emAtendimento).toBe(1)
  })

  it("não usa request.status diretamente para resolvidasNoMes", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          { status: "recebida", occurredAt: localInstant(2026, 9, 1) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.resolvidasNoMes).toBe(0)
  })

  it("série semanal sempre tem 7 baldes, em ordem cronológica", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const result = deriveRequestAnalytics([], referenceDate)
    expect(result.weeklySeries).toHaveLength(7)
    expect(result.weeklySeries.map((entry) => entry.day)).toEqual([
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
      "Dom",
    ])
  })

  it("janela de 7 dias inclui o dia de referência", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [buildRequest({ date: "2026-09-06" })]
    const result = deriveRequestAnalytics(requests, referenceDate)
    const total = result.weeklySeries.reduce(
      (sum, entry) => sum + entry.registradas,
      0,
    )
    expect(total).toBe(1)
  })

  it("série de registradas usa UrbanRequest.date", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        date: "2026-09-04",
        timeline: [
          { status: "recebida", occurredAt: localInstant(2026, 9, 4) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    const totalRegistradas = result.weeklySeries.reduce(
      (sum, entry) => sum + entry.registradas,
      0,
    )
    expect(totalRegistradas).toBe(1)
  })

  it("série de resolvidas usa timeline.occurredAt", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        date: "2026-09-01",
        status: "resolvida",
        timeline: [
          { status: "recebida", occurredAt: localInstant(2026, 9, 1) },
          { status: "resolvida", occurredAt: localInstant(2026, 9, 5) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    const totalResolvidas = result.weeklySeries.reduce(
      (sum, entry) => sum + entry.resolvidas,
      0,
    )
    expect(totalResolvidas).toBe(1)
  })

  it("múltiplas resolvidas da mesma solicitação no mesmo dia contam uma vez", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          { status: "resolvida", occurredAt: localInstant(2026, 9, 5, 8, 0) },
          { status: "resolvida", occurredAt: localInstant(2026, 9, 5, 18, 0) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    const totalResolvidas = result.weeklySeries.reduce(
      (sum, entry) => sum + entry.resolvidas,
      0,
    )
    expect(totalResolvidas).toBe(1)
  })

  it("resoluções da mesma solicitação em dias diferentes aparecem nos dois dias", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          { status: "resolvida", occurredAt: localInstant(2026, 9, 2) },
          { status: "analise", occurredAt: localInstant(2026, 9, 3) },
          { status: "resolvida", occurredAt: localInstant(2026, 9, 4) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    const totalResolvidas = result.weeklySeries.reduce(
      (sum, entry) => sum + entry.resolvidas,
      0,
    )
    expect(totalResolvidas).toBe(2)
  })

  it("regressão posterior não apaga a resolução diária histórica", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({
        status: "programada",
        timeline: [
          { status: "resolvida", occurredAt: localInstant(2026, 9, 2) },
          { status: "programada", occurredAt: localInstant(2026, 9, 4) },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    const totalResolvidas = result.weeklySeries.reduce(
      (sum, entry) => sum + entry.resolvidas,
      0,
    )
    expect(totalResolvidas).toBe(1)
  })

  it("respeita fronteiras civis de mês mesmo perto da virada", () => {
    const referenceDate = new Date(2026, 8, 1, 0, 30, 0)
    const requests = [
      buildRequest({
        status: "resolvida",
        timeline: [
          {
            status: "resolvida",
            occurredAt: localInstant(2026, 8, 31, 23, 45),
          },
        ],
      }),
    ]
    const result = deriveRequestAnalytics(requests, referenceDate)
    expect(result.kpis.resolvidasNoMes).toBe(0)
  })

  it("não muta o array recebido", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const requests = [
      buildRequest({ date: "2026-09-01" }),
      buildRequest({ date: "2026-09-02" }),
    ]
    const original = [...requests]
    deriveRequestAnalytics(requests, referenceDate)
    expect(requests).toEqual(original)
    expect(requests[0]).toBe(original[0])
    expect(requests[1]).toBe(original[1])
  })

  it("nenhum resultado numérico é NaN ou Infinity", () => {
    const referenceDate = new Date(2026, 8, 6, 12, 0, 0)
    const result = deriveRequestAnalytics(seedRequests, referenceDate)
    const allNumbers = [
      ...Object.values(result.kpis),
      ...result.categoryData.map((entry) => entry.value),
      ...result.weeklySeries.flatMap((entry) => [
        entry.registradas,
        entry.resolvidas,
      ]),
    ]
    for (const value of allNumbers) {
      expect(Number.isFinite(value)).toBe(true)
    }
  })
})
