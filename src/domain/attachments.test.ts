import { describe, expect, it } from "vitest"
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  validateAttachmentFile,
} from "./attachments"

interface FakeFile {
  type: string
  size: number
}

function fakeFile(type: string, size: number): FakeFile {
  return { type, size }
}

describe("validateAttachmentFile", () => {
  it("aceita JPEG válido", () => {
    expect(validateAttachmentFile(fakeFile("image/jpeg", 1024))).toEqual({
      valid: true,
    })
  })

  it("aceita PNG válido", () => {
    expect(validateAttachmentFile(fakeFile("image/png", 1024))).toEqual({
      valid: true,
    })
  })

  it("aceita WebP válido", () => {
    expect(validateAttachmentFile(fakeFile("image/webp", 1024))).toEqual({
      valid: true,
    })
  })

  it("rejeita MIME incompatível com formato inválido", () => {
    const result = validateAttachmentFile(fakeFile("application/pdf", 1024))
    expect(result).toEqual({
      valid: false,
      error: {
        code: "invalid-format",
        message: "Selecione uma imagem nos formatos JPG, PNG ou WebP.",
      },
    })
  })

  it("rejeita MIME vazio com formato inválido", () => {
    const result = validateAttachmentFile(fakeFile("", 1024))
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error.code).toBe("invalid-format")
    }
  })

  it("rejeita arquivo vazio, mesmo com MIME válido", () => {
    const result = validateAttachmentFile(fakeFile("image/png", 0))
    expect(result).toEqual({
      valid: false,
      error: {
        code: "empty-file",
        message: "A imagem selecionada está vazia.",
      },
    })
  })

  it("aceita tamanho abaixo de 5 MiB", () => {
    const result = validateAttachmentFile(
      fakeFile("image/jpeg", MAX_ATTACHMENT_SIZE_BYTES - 1),
    )
    expect(result.valid).toBe(true)
  })

  it("aceita tamanho exatamente igual a 5 MiB", () => {
    const result = validateAttachmentFile(
      fakeFile("image/jpeg", MAX_ATTACHMENT_SIZE_BYTES),
    )
    expect(result.valid).toBe(true)
  })

  it("rejeita tamanho acima de 5 MiB com tamanho excedido", () => {
    const result = validateAttachmentFile(
      fakeFile("image/jpeg", MAX_ATTACHMENT_SIZE_BYTES + 1),
    )
    expect(result).toEqual({
      valid: false,
      error: {
        code: "too-large",
        message: "A imagem deve ter no máximo 5 MB.",
      },
    })
  })
})
