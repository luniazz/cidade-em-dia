/**
 * Camada pura de agregação de indicadores e gráficos do dashboard.
 *
 * Não acessa `localStorage`, IndexedDB, `requestService` nem a data atual do
 * sistema diretamente: recebe as solicitações já carregadas e uma
 * `referenceDate` explícita, e apenas deriva números a partir delas. Isso
 * mantém a função determinística e testável sem mocks de tempo ou de
 * armazenamento.
 */

import { REQUEST_CATEGORIES } from "./requests"
import type { RequestCategoryId, RequestStatus, UrbanRequest } from "./requests"
import { getLocalDateOnly } from "../utils/date"

export interface RequestKpis {
  aguardandoAtendimento: number
  emAtendimento: number
  resolvidasNoMes: number
  totalSolicitacoes: number
}

export interface CategoryChartEntry {
  name: string
  value: number
}

export interface DailySeriesEntry {
  day: string
  registradas: number
  resolvidas: number
}

export interface RequestAnalytics {
  kpis: RequestKpis
  categoryData: CategoryChartEntry[]
  weeklySeries: DailySeriesEntry[]
}

const EM_ATENDIMENTO_STATUSES: ReadonlySet<RequestStatus> = new Set([
  "analise",
  "programada",
  "execucao",
])

const WEEKDAY_LABELS_PT_BR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function getLocalMonthKey(reference: Date): string {
  const year = reference.getFullYear()
  const month = reference.getMonth() + 1
  return `${year}-${String(month).padStart(2, "0")}`
}

interface CivilDayBucket {
  dateKey: string
  label: string
}

function buildLastSevenCivilDays(referenceDate: Date): CivilDayBucket[] {
  const days: CivilDayBucket[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - offset,
    )
    days.push({
      dateKey: getLocalDateOnly(day),
      label: WEEKDAY_LABELS_PT_BR[day.getDay()],
    })
  }
  return days
}

function countAguardandoAtendimento(requests: readonly UrbanRequest[]): number {
  let count = 0
  for (const request of requests) {
    if (request.status === "recebida") count++
  }
  return count
}

function countEmAtendimento(requests: readonly UrbanRequest[]): number {
  let count = 0
  for (const request of requests) {
    if (EM_ATENDIMENTO_STATUSES.has(request.status)) count++
  }
  return count
}

function countResolvidasNoMes(
  requests: readonly UrbanRequest[],
  referenceDate: Date,
): number {
  const monthKey = getLocalMonthKey(referenceDate)
  let count = 0
  for (const request of requests) {
    const resolvedInMonth = request.timeline.some(
      (event) =>
        event.status === "resolvida" &&
        getLocalMonthKey(new Date(event.occurredAt)) === monthKey,
    )
    if (resolvedInMonth) count++
  }
  return count
}

function buildCategoryData(
  requests: readonly UrbanRequest[],
): CategoryChartEntry[] {
  const counts = new Map<RequestCategoryId, number>()
  for (const category of REQUEST_CATEGORIES) {
    counts.set(category.id, 0)
  }
  for (const request of requests) {
    counts.set(request.categoryId, (counts.get(request.categoryId) ?? 0) + 1)
  }
  return REQUEST_CATEGORIES.map((category) => ({
    name: category.label,
    value: counts.get(category.id) ?? 0,
  }))
}

function buildWeeklySeries(
  requests: readonly UrbanRequest[],
  referenceDate: Date,
): DailySeriesEntry[] {
  const days = buildLastSevenCivilDays(referenceDate)
  const registradasByDay = new Map<string, number>()
  const resolvidasByDay = new Map<string, number>()
  for (const { dateKey } of days) {
    registradasByDay.set(dateKey, 0)
    resolvidasByDay.set(dateKey, 0)
  }

  for (const request of requests) {
    if (registradasByDay.has(request.date)) {
      registradasByDay.set(
        request.date,
        (registradasByDay.get(request.date) ?? 0) + 1,
      )
    }

    const resolvedDayKeys = new Set<string>()
    for (const event of request.timeline) {
      if (event.status !== "resolvida") continue
      resolvedDayKeys.add(getLocalDateOnly(new Date(event.occurredAt)))
    }
    for (const dayKey of resolvedDayKeys) {
      if (resolvidasByDay.has(dayKey)) {
        resolvidasByDay.set(dayKey, (resolvidasByDay.get(dayKey) ?? 0) + 1)
      }
    }
  }

  return days.map(({ dateKey, label }) => ({
    day: label,
    registradas: registradasByDay.get(dateKey) ?? 0,
    resolvidas: resolvidasByDay.get(dateKey) ?? 0,
  }))
}

export function deriveRequestAnalytics(
  requests: readonly UrbanRequest[],
  referenceDate: Date,
): RequestAnalytics {
  return {
    kpis: {
      aguardandoAtendimento: countAguardandoAtendimento(requests),
      emAtendimento: countEmAtendimento(requests),
      resolvidasNoMes: countResolvidasNoMes(requests, referenceDate),
      totalSolicitacoes: requests.length,
    },
    categoryData: buildCategoryData(requests),
    weeklySeries: buildWeeklySeries(requests, referenceDate),
  }
}
