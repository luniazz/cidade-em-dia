/**
 * Geração de identificador técnico único (UUID v4) para o registro interno
 * de uma `UrbanRequest`. É diferente do protocolo: o protocolo é o código
 * curto orientado ao cidadão (`HGV-AAAA-NNNNN`), enquanto este id é o
 * identificador estável usado internamente pela camada de persistência.
 *
 * Prioriza `crypto.randomUUID()`. Durante o desenvolvimento a aplicação pode
 * ser acessada pelo endereço HTTP da rede local exposto pelo Vite (não
 * `localhost`), um contexto que o navegador pode não considerar seguro; nesse
 * caso `randomUUID` pode não existir mesmo com `crypto.getRandomValues`
 * disponível. Por isso existe um fallback que monta o UUID v4 manualmente a
 * partir de bytes aleatórios criptograficamente seguros. Não é usado
 * `Math.random()` em nenhum caminho, pois não é adequado para identificadores
 * que precisam de baixíssima chance de colisão.
 */

export interface CryptoLike {
  randomUUID?: () => string
  getRandomValues?: <T extends ArrayBufferView>(array: T) => T
}

/**
 * Gera um UUID v4 a partir de 16 bytes aleatórios, configurando os bits de
 * versão (4) e variante (10xxxxxx) exigidos pelo formato. Isolado para poder
 * ser testado diretamente com uma fonte de bytes determinística.
 */
export function generateUuidV4FromRandomValues(
  getRandomValues: (array: Uint8Array) => Uint8Array,
): string {
  const bytes = getRandomValues(new Uint8Array(16))

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Gera um identificador único. Lança um erro claro (nunca gera um id fraco
 * com `Math.random()` ou `Date.now()`) quando nenhuma API criptográfica
 * nativa está disponível.
 */
export function generateId(cryptoSource?: CryptoLike): string {
  const source = cryptoSource ?? globalThis.crypto as CryptoLike | undefined

  if (typeof source?.randomUUID === "function") {
    return source.randomUUID()
  }

  if (typeof source?.getRandomValues === "function") {
    return generateUuidV4FromRandomValues(
      source.getRandomValues.bind(source) as (array: Uint8Array) => Uint8Array,
    )
  }

  throw new Error(
    "Nenhuma API criptográfica nativa (crypto.randomUUID ou crypto.getRandomValues) está disponível para gerar um identificador seguro.",
  )
}
