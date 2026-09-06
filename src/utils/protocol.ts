/**
 * Utilitários puros para o protocolo HGV-AAAA-NNNNN.
 *
 * Este módulo não acessa React, localStorage ou estado global. `requestService`
 * é quem integra `getNextSequence` ao cadastro, recalculando a sequência a
 * partir dos protocolos já persistidos a cada nova solicitação.
 */

const PROTOCOL_PREFIX = "HGV"
const PROTOCOL_PATTERN = /^HGV-(\d{4})-(\d{5})$/
const MIN_PROTOCOL_YEAR = 1000
const MAX_PROTOCOL_YEAR = 9999
const MIN_PROTOCOL_SEQUENCE = 1
const MAX_PROTOCOL_SEQUENCE = 99999

export interface ProtocolParts {
  year: number
  sequence: number
}

export function formatProtocol(year: number, sequence: number): string {
  if (!isValidProtocolYear(year)) {
    throw new RangeError("O ano do protocolo deve possuir quatro dígitos.")
  }
  if (!isValidProtocolSequence(sequence)) {
    throw new RangeError("A sequência do protocolo deve estar entre 1 e 99999.")
  }

  const yyyy = String(year).padStart(4, "0")
  const nnnnn = String(sequence).padStart(5, "0")
  return `${PROTOCOL_PREFIX}-${yyyy}-${nnnnn}`
}

function isValidProtocolYear(year: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= MIN_PROTOCOL_YEAR &&
    year <= MAX_PROTOCOL_YEAR
  )
}

function isValidProtocolSequence(sequence: number): boolean {
  return (
    Number.isInteger(sequence) &&
    sequence >= MIN_PROTOCOL_SEQUENCE &&
    sequence <= MAX_PROTOCOL_SEQUENCE
  )
}

/** Interpreta um protocolo, retornando `null` quando o formato é inválido. */
export function parseProtocol(value: string): ProtocolParts | null {
  const match = PROTOCOL_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const sequence = Number(match[2])
  if (!isValidProtocolYear(year) || !isValidProtocolSequence(sequence)) {
    return null
  }

  return { year, sequence }
}

export function isValidProtocol(value: string): boolean {
  return parseProtocol(value) !== null
}

/**
 * Calcula a próxima sequência disponível para um ano, a partir da maior
 * sequência já usada nesse ano entre os protocolos informados. Não garante
 * unicidade global: apenas evita repetir uma sequência já presente na lista
 * recebida.
 */
export function getNextSequence(
  existingProtocols: readonly string[],
  year: number,
): number {
  let maxSequence = 0
  for (const protocol of existingProtocols) {
    const parsed = parseProtocol(protocol)
    if (parsed && parsed.year === year && parsed.sequence > maxSequence) {
      maxSequence = parsed.sequence
    }
  }
  const nextSequence = maxSequence + 1
  if (!isValidProtocolSequence(nextSequence)) {
    throw new RangeError(`Não há sequência disponível para o ano ${year}.`)
  }

  return nextSequence
}
