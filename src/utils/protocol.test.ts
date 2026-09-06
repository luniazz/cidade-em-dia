import { describe, expect, it } from "vitest"
import {
  formatProtocol,
  getNextSequence,
  isValidProtocol,
  parseProtocol,
} from "./protocol"

describe("formatProtocol", () => {
  it("formata ano e sequência no padrão HGV-AAAA-NNNNN", () => {
    expect(formatProtocol(2026, 125)).toBe("HGV-2026-00125")
  })

  it("preenche a sequência com zeros à esquerda até cinco dígitos", () => {
    expect(formatProtocol(2026, 1)).toBe("HGV-2026-00001")
  })

  it("rejeita ano ou sequência que produziriam protocolo fora do padrão", () => {
    expect(() => formatProtocol(26, 1)).toThrow(RangeError)
    expect(() => formatProtocol(2026, 0)).toThrow(RangeError)
    expect(() => formatProtocol(2026, 1.5)).toThrow(RangeError)
    expect(() => formatProtocol(2026, 100000)).toThrow(RangeError)
  })
})

describe("parseProtocol", () => {
  it("interpreta um protocolo válido", () => {
    expect(parseProtocol("HGV-2026-00125")).toEqual({
      year: 2026,
      sequence: 125,
    })
  })

  it("retorna null para formato inválido", () => {
    expect(parseProtocol("HGV-26-125")).toBeNull()
    expect(parseProtocol("ABC-2026-00125")).toBeNull()
    expect(parseProtocol("HGV-0000-00001")).toBeNull()
    expect(parseProtocol("HGV-2026-00000")).toBeNull()
    expect(parseProtocol("")).toBeNull()
  })
})

describe("isValidProtocol", () => {
  it("valida protocolos bem formados", () => {
    expect(isValidProtocol("HGV-2026-00125")).toBe(true)
    expect(isValidProtocol("HGV-2026-125")).toBe(false)
  })
})

describe("getNextSequence", () => {
  it("calcula a próxima sequência a partir da maior existente no ano", () => {
    const protocols = ["HGV-2026-00001", "HGV-2026-00042", "HGV-2025-00099"]
    expect(getNextSequence(protocols, 2026)).toBe(43)
  })

  it("começa em 1 quando não há protocolos para o ano", () => {
    expect(getNextSequence(["HGV-2025-00010"], 2026)).toBe(1)
  })

  it("ignora protocolos com formato inválido", () => {
    expect(getNextSequence(["invalido", "HGV-2026-00005"], 2026)).toBe(6)
  })

  it("rejeita a geração após o limite de cinco dígitos", () => {
    expect(() => getNextSequence(["HGV-2026-99999"], 2026)).toThrow(RangeError)
  })
})
