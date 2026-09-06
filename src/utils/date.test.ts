import { describe, expect, it } from "vitest"
import {
  formatDateOnlyPtBR,
  formatDateTimePtBR,
  getLocalDateOnly,
  isIsoInstant,
} from "./date"

describe("formatDateOnlyPtBR", () => {
  it("formata uma data civil válida para dd/mm/aaaa", () => {
    expect(formatDateOnlyPtBR("2026-08-28")).toBe("28/08/2026")
  })

  it("retorna null para valor vazio", () => {
    expect(formatDateOnlyPtBR("")).toBeNull()
  })

  it("retorna null para formato dd/mm/aaaa (não é YYYY-MM-DD)", () => {
    expect(formatDateOnlyPtBR("28/08/2026")).toBeNull()
  })

  it("retorna null para dia inexistente no mês (2026-02-30)", () => {
    expect(formatDateOnlyPtBR("2026-02-30")).toBeNull()
  })

  it("retorna null para 29 de fevereiro em ano não bissexto (2025)", () => {
    expect(formatDateOnlyPtBR("2025-02-29")).toBeNull()
  })

  it("aceita 29 de fevereiro em ano bissexto (2024)", () => {
    expect(formatDateOnlyPtBR("2024-02-29")).toBe("29/02/2024")
  })

  it("valida corretamente a virada de mês e de ano", () => {
    expect(formatDateOnlyPtBR("2026-01-31")).toBe("31/01/2026")
    expect(formatDateOnlyPtBR("2026-12-31")).toBe("31/12/2026")
    expect(formatDateOnlyPtBR("2026-04-31")).toBeNull()
  })

  it("retorna null para texto malformado", () => {
    expect(formatDateOnlyPtBR("2026-8-28")).toBeNull()
    expect(formatDateOnlyPtBR("not-a-date")).toBeNull()
  })

  it("não lança exceção para entradas inválidas", () => {
    expect(() => formatDateOnlyPtBR("qualquer coisa")).not.toThrow()
  })
})

describe("getLocalDateOnly", () => {
  it("usa os componentes locais da data, não UTC", () => {
    const reference = new Date(2026, 0, 1, 23, 30)
    expect(getLocalDateOnly(reference)).toBe("2026-01-01")
  })

  it("preenche mês e dia com zero à esquerda", () => {
    const reference = new Date(2026, 8, 5)
    expect(getLocalDateOnly(reference)).toBe("2026-09-05")
  })

  it("produz uma saída sempre aceita por formatDateOnlyPtBR", () => {
    const reference = new Date(2024, 1, 29)
    const dateOnly = getLocalDateOnly(reference)
    expect(formatDateOnlyPtBR(dateOnly)).toBe("29/02/2024")
  })
})

describe("formatDateTimePtBR", () => {
  it("formata um instante ISO válido como dd/mm/aaaa às HH:mm", () => {
    expect(formatDateTimePtBR("2026-08-28T09:14:00.000Z")).toBe(
      "28/08/2026 às 09:14",
    )
  })

  it("preenche hora e minuto com zero à esquerda", () => {
    expect(formatDateTimePtBR("2026-01-01T05:03:00.000Z")).toBe(
      "01/01/2026 às 05:03",
    )
  })

  it("retorna null para valor vazio", () => {
    expect(formatDateTimePtBR("")).toBeNull()
  })

  it("retorna null para texto que não é um instante válido", () => {
    expect(formatDateTimePtBR("não é uma data")).toBeNull()
    expect(formatDateTimePtBR("2026-13-40T99:99:00.000Z")).toBeNull()
  })

  it("rejeita datas sem horário/fuso e formatos de data dependentes do ambiente", () => {
    expect(formatDateTimePtBR("2026-08-28")).toBeNull()
    expect(formatDateTimePtBR("August 28, 2026 09:14")).toBeNull()
  })

  it("não lança exceção para entradas inválidas", () => {
    expect(() => formatDateTimePtBR("qualquer coisa")).not.toThrow()
  })

  it("aceita instantes sem milissegundos ou com offset explícito", () => {
    expect(formatDateTimePtBR("2026-08-28T09:14:00Z")).toBe(
      "28/08/2026 às 09:14",
    )
    expect(formatDateTimePtBR("2026-08-28T09:14:00+00:00")).toBe(
      "28/08/2026 às 09:14",
    )
  })
})

describe("isIsoInstant", () => {
  it("aceita instantes ISO completos com Z ou offset explícito", () => {
    expect(isIsoInstant("2026-08-28T09:14:00.000Z")).toBe(true)
    expect(isIsoInstant("2026-08-28T09:14:00-03:00")).toBe(true)
  })

  it("rejeita valores inválidos ou sem fuso explícito", () => {
    expect(isIsoInstant("2026-08-28")).toBe(false)
    expect(isIsoInstant("2026-08-28T09:14:00")).toBe(false)
    expect(isIsoInstant("2026-02-30T09:14:00.000Z")).toBe(false)
    expect(isIsoInstant("2026-08-28T24:00:00.000Z")).toBe(false)
    expect(isIsoInstant("August 28, 2026 09:14")).toBe(false)
    expect(isIsoInstant("não é uma data")).toBe(false)
  })
})
