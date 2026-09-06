import { describe, expect, it } from "vitest"
import { REQUEST_CATEGORIES } from "../domain/requests"
import { demoRequests } from "./demoRequests"
import { seedRequests } from "./seedRequests"

const DEMO_PROTOCOLS = [
  "HGV-2026-00120",
  "HGV-2026-00121",
  "HGV-2026-00122",
  "HGV-2026-00123",
  "HGV-2026-00124",
  "HGV-2026-00125",
]

describe("seedRequests", () => {
  it("contém exatamente 100 registros", () => {
    expect(seedRequests).toHaveLength(100)
  })

  it("segue a distribuição oficial 32/27/18/13/10 por categoria", () => {
    const expected: Record<string, number> = {
      "buracos-vias": 32,
      "iluminacao-publica": 27,
      "descarte-irregular": 18,
      "poda-arvores": 13,
      sinalizacao: 10,
    }

    for (const category of REQUEST_CATEGORIES) {
      const count = seedRequests.filter(
        (r) => r.categoryId === category.id,
      ).length
      expect(count).toBe(expected[category.id])
    }
  })

  it("não usa a categoria obsoleta Calçada danificada", () => {
    const validIds = new Set(REQUEST_CATEGORIES.map((c) => c.id))
    expect(seedRequests.every((r) => validIds.has(r.categoryId))).toBe(true)
  })

  it("possui ids únicos", () => {
    const ids = seedRequests.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("possui protocolos únicos", () => {
    const protocols = seedRequests.map((r) => r.protocol)
    expect(new Set(protocols).size).toBe(protocols.length)
  })

  it("preserva os seis protocolos de demonstração, incluindo HGV-2026-00125", () => {
    const protocols = new Set(seedRequests.map((r) => r.protocol))
    for (const demoProtocol of DEMO_PROTOCOLS) {
      expect(protocols.has(demoProtocol)).toBe(true)
    }
  })

  it("inclui exatamente os seis registros de demoRequests", () => {
    const seedIds = new Set(seedRequests.map((r) => r.id))
    for (const demo of demoRequests) {
      expect(seedIds.has(demo.id)).toBe(true)
    }
    expect(demoRequests).toHaveLength(6)
  })

  it("é determinística entre chamadas (mesmo módulo, mesmo conteúdo)", () => {
    expect(seedRequests[0]).toEqual({
      id: "seed-001",
      protocol: "HGV-2026-00001",
      categoryId: "buracos-vias",
      address: "Rua das Flores, 101 — Bairro 2",
      description: "Buraco na via com risco para veículos e pedestres.",
      date: "2026-01-01",
      status: "analise",
      timeline: [
        { status: "recebida", occurredAt: "2026-01-01T12:00:00.000Z" },
        { status: "analise", occurredAt: "2026-01-01T12:00:00.000Z" },
      ],
    })
  })

  it("os protocolos gerados usam sequências dentro de HGV-2026-00001..00094", () => {
    const generated = seedRequests.filter((r) => r.id.startsWith("seed-"))
    expect(generated).toHaveLength(94)
    for (const request of generated) {
      const sequence = Number(request.protocol.split("-")[2])
      expect(sequence).toBeGreaterThanOrEqual(1)
      expect(sequence).toBeLessThanOrEqual(94)
    }
  })
})
