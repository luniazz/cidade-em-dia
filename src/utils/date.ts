/**
 * Utilitários puros para datas civis (sem hora) no formato YYYY-MM-DD.
 *
 * Uma data YYYY-MM-DD nunca é interpretada via `new Date(string)`: esse
 * construtor trata a entrada como UTC, o que pode mudar o dia exibido
 * dependendo do fuso horário do navegador. Aqui o texto é validado e
 * formatado por aritmética simples sobre os componentes ano/mês/dia.
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_INSTANT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-](\d{2}):(\d{2}))$/

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getDaysInMonth(year: number, month: number): number {
  const daysByMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  return daysByMonth[month - 1]
}

function isValidCivilDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false
  if (day < 1 || day > getDaysInMonth(year, month)) return false
  return true
}

/**
 * Converte uma data civil válida em YYYY-MM-DD para o formato visível
 * dd/mm/aaaa. Retorna `null` (em vez de lançar exceção ou devolver o texto
 * original) quando o valor está vazio, malformado ou representa uma data
 * inexistente no calendário — por exemplo "2026-02-30" ou "2025-02-29".
 */
export function formatDateOnlyPtBR(value: string): string | null {
  if (!value) return null

  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!isValidCivilDate(year, month, day)) return null

  const dd = String(day).padStart(2, "0")
  const mm = String(month).padStart(2, "0")
  const yyyy = String(year).padStart(4, "0")
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Data civil atual no formato YYYY-MM-DD, a partir dos componentes locais
 * (não UTC) de `reference`. Não usa `toISOString().slice(0, 10)`, que
 * trabalha em UTC e pode reportar o dia errado perto da virada da meia-noite
 * local.
 */
export function getLocalDateOnly(reference: Date = new Date()): string {
  const year = reference.getFullYear()
  const month = reference.getMonth() + 1
  const day = reference.getDate()

  const mm = String(month).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

/**
 * Converte um instante ISO 8601 completo (ex.: `2026-08-28T09:14:00.000Z`,
 * como o produzido por `Date.prototype.toISOString`) para o formato visível
 * `dd/mm/aaaa às HH:mm`.
 *
 * Diferente de `formatDateOnlyPtBR`, aqui o uso de `new Date(value)` é
 * correto e intencional: a entrada é um instante com fuso horário explícito
 * (não uma data civil ambígua "YYYY-MM-DD"), que é exatamente o que o
 * construtor `Date` interpreta sem ambiguidade. A apresentação usa os
 * componentes locais do navegador, então o horário exibido acompanha o fuso
 * de quem está vendo a tela.
 *
 * Retorna `null` (nunca lança exceção nem devolve o texto original) para
 * valores vazios ou que não representem um instante válido.
 */
export function isIsoInstant(value: string): boolean {
  const match = ISO_INSTANT_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[8] === undefined ? 0 : Number(match[8])
  const offsetMinute = match[9] === undefined ? 0 : Number(match[9])

  if (!isValidCivilDate(year, month, day)) return false
  if (hour > 23 || minute > 59 || second > 59) return false
  if (offsetHour > 23 || offsetMinute > 59) return false

  return !Number.isNaN(new Date(value).getTime())
}

export function formatDateTimePtBR(isoInstant: string): string | null {
  if (!isIsoInstant(isoInstant)) return null

  const parsed = new Date(isoInstant)
  const dd = String(parsed.getDate()).padStart(2, "0")
  const mm = String(parsed.getMonth() + 1).padStart(2, "0")
  const yyyy = parsed.getFullYear()
  const hh = String(parsed.getHours()).padStart(2, "0")
  const min = String(parsed.getMinutes()).padStart(2, "0")

  return `${dd}/${mm}/${yyyy} às ${hh}:${min}`
}
