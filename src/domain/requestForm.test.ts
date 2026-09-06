import { describe, expect, it } from "vitest"
import {
  createEmptyRequestFormValues,
  validateRequestForm,
} from "./requestForm"

function validBase() {
  return {
    ...createEmptyRequestFormValues(),
    categoryId: "buracos-vias" as const,
    address: "Rua das Flores, 320",
    description: "Buraco grande na via.",
    privacyAccepted: true,
  }
}

describe("validateRequestForm", () => {
  it("é válido sem nome e sem e-mail", () => {
    const errors = validateRequestForm(validBase())
    expect(errors).toEqual({})
  })

  it("não reclama do e-mail quando ele está vazio", () => {
    const errors = validateRequestForm({ ...validBase(), email: "" })
    expect(errors.email).toBeUndefined()
  })

  it("reclama do e-mail quando preenchido com formato inválido", () => {
    const errors = validateRequestForm({ ...validBase(), email: "invalido" })
    expect(errors.email).toBeDefined()
  })

  it("aceita e-mail preenchido em formato válido", () => {
    const errors = validateRequestForm({
      ...validBase(),
      email: "pessoa@email.com",
    })
    expect(errors.email).toBeUndefined()
  })

  it("exige categoria, endereço e descrição", () => {
    const errors = validateRequestForm(createEmptyRequestFormValues())
    expect(errors.categoryId).toBeDefined()
    expect(errors.address).toBeDefined()
    expect(errors.description).toBeDefined()
    expect(errors.privacyAccepted).toBeDefined()
    expect(errors.name).toBeUndefined()
    expect(errors.email).toBeUndefined()
  })

  it("exige aceite dos termos de privacidade", () => {
    const errors = validateRequestForm({
      ...validBase(),
      privacyAccepted: false,
    })
    expect(errors.privacyAccepted).toBeDefined()
  })

  it("rejeita endereço com 1 caractere", () => {
    const errors = validateRequestForm({ ...validBase(), address: "a" })
    expect(errors.address).toBeDefined()
  })

  it("rejeita endereço com menos de 5 caracteres", () => {
    const errors = validateRequestForm({ ...validBase(), address: "abcd" })
    expect(errors.address).toBeDefined()
  })

  it("aceita endereço com 5 ou mais caracteres", () => {
    const exactlyFive = validateRequestForm({
      ...validBase(),
      address: "abcde",
    })
    expect(exactlyFive.address).toBeUndefined()

    const longer = validateRequestForm({
      ...validBase(),
      address: "Rua das Acácias, 12",
    })
    expect(longer.address).toBeUndefined()
  })

  it("rejeita descrição muito curta", () => {
    const errors = validateRequestForm({ ...validBase(), description: "curta" })
    expect(errors.description).toBeDefined()
  })

  it("aceita descrição com 10 ou mais caracteres", () => {
    const exactlyTen = validateRequestForm({
      ...validBase(),
      description: "0123456789",
    })
    expect(exactlyTen.description).toBeUndefined()
  })

  it("trata endereço composto somente por espaços como vazio, não apenas curto", () => {
    const errors = validateRequestForm({ ...validBase(), address: "     " })
    expect(errors.address).toBe("Informe o endereço.")
  })

  it("trata descrição composta somente por espaços como vazia, não apenas curta", () => {
    const errors = validateRequestForm({
      ...validBase(),
      description: "          ",
    })
    expect(errors.description).toBe("Descreva o problema.")
  })
})
