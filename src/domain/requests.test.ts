import { describe, expect, it } from "vitest"
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  getRequestCategoryLabel,
  isRequestCategoryId,
  isRequestStatus,
} from "./requests"

describe("REQUEST_CATEGORIES", () => {
  it("contém exatamente as cinco categorias oficiais", () => {
    expect(REQUEST_CATEGORIES.map((c) => c.label)).toEqual([
      "Buracos em vias",
      "Iluminação pública",
      "Descarte irregular de resíduos",
      "Poda de árvores",
      "Sinalização",
    ])
  })

  it("não contém a categoria obsoleta Calçada danificada", () => {
    const labels = REQUEST_CATEGORIES.map((c) => c.label)
    const ids = REQUEST_CATEGORIES.map((c) => c.id)
    expect(labels.some((l) => l.includes("Calçada"))).toBe(false)
    expect(ids.some((id) => id.includes("calcada"))).toBe(false)
  })

  it("possui identificadores internos estáveis e únicos", () => {
    const ids = REQUEST_CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("getRequestCategoryLabel resolve o rótulo pelo id", () => {
    expect(getRequestCategoryLabel("buracos-vias")).toBe("Buracos em vias")
    expect(getRequestCategoryLabel("sinalizacao")).toBe("Sinalização")
  })

  it("isRequestCategoryId reconhece apenas ids válidos", () => {
    expect(isRequestCategoryId("buracos-vias")).toBe(true)
    expect(isRequestCategoryId("calcada-danificada")).toBe(false)
    expect(isRequestCategoryId("")).toBe(false)
  })
})

describe("REQUEST_STATUSES", () => {
  it("contém exatamente os cinco status oficiais, sem restrição de transição", () => {
    expect(REQUEST_STATUSES).toEqual([
      "recebida",
      "analise",
      "programada",
      "execucao",
      "resolvida",
    ])
  })

  it("possui um rótulo em português para cada status", () => {
    expect(REQUEST_STATUS_LABELS).toEqual({
      recebida: "Recebida",
      analise: "Em análise",
      programada: "Programada",
      execucao: "Em execução",
      resolvida: "Resolvida",
    })
  })

  it("isRequestStatus reconhece apenas status válidos", () => {
    expect(isRequestStatus("recebida")).toBe(true)
    expect(isRequestStatus("cancelada")).toBe(false)
  })
})
