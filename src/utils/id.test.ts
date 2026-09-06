import { describe, expect, it } from "vitest"
import { generateId, generateUuidV4FromRandomValues } from "./id"
import type { CryptoLike } from "./id"

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe("generateId", () => {
  it("usa crypto.randomUUID quando disponível", () => {
    const fixedUuid = "11111111-1111-4111-8111-111111111111"
    const fakeCrypto: CryptoLike = {
      randomUUID: () => fixedUuid,
    }
    expect(generateId(fakeCrypto)).toBe(fixedUuid)
  })

  it("usa o fallback com crypto.getRandomValues quando randomUUID não existe", () => {
    let callCount = 0
    const fakeCrypto: CryptoLike = {
      getRandomValues: <T extends ArrayBufferView>(array: T) => {
        callCount++
        const bytes = array as unknown as Uint8Array
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = i
        }
        return array
      },
    }

    const id = generateId(fakeCrypto)
    expect(callCount).toBe(1)
    expect(id).toMatch(UUID_V4_PATTERN)
  })

  it("lança erro claro quando nenhuma API criptográfica está disponível", () => {
    expect(() => generateId({})).toThrow(/nenhuma api criptográfica/i)
  })

  it("não usa Math.random nem Date.now (mesma entrada de bytes produz o mesmo id)", () => {
    const buildFakeCrypto = (): CryptoLike => ({
      getRandomValues: <T extends ArrayBufferView>(array: T) => {
        const bytes = array as unknown as Uint8Array
        bytes.fill(0xab)
        return array
      },
    })

    expect(generateId(buildFakeCrypto())).toBe(generateId(buildFakeCrypto()))
  })
})

describe("generateUuidV4FromRandomValues", () => {
  it("produz o formato UUID v4 convencional com bits de versão e variante corretos", () => {
    const id = generateUuidV4FromRandomValues((array) => {
      array.fill(0x00)
      return array
    })
    expect(id).toMatch(UUID_V4_PATTERN)
  })

  it("preserva os demais bits dos bytes aleatórios fornecidos", () => {
    const id = generateUuidV4FromRandomValues((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = 0xff
      }
      return array
    })
    // Todos os bytes 0xff, exceto os nibbles de versão/variante forçados.
    expect(id).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff")
  })
})
