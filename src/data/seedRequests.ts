import { REQUEST_STATUSES } from "../domain/requests"
import type {
  RequestCategoryId,
  RequestTimelineEvent,
  RequestStatus,
  UrbanRequest,
} from "../domain/requests"
import { demoRequests } from "./demoRequests"

/**
 * Seed inicial da camada de persistência: usada por `requestService` quando
 * o `localStorage` ainda não tem a chave `cidade-em-dia:requests:v1`.
 *
 * A geração é determinística: não usa `Math.random()`, `Date.now()` nem a
 * data atual, para que o mesmo conjunto de 100 registros seja produzido em
 * qualquer execução. A garantia definitiva de unicidade de id/protocolo
 * pertence à camada de persistência (`requestService`); aqui apenas
 * evitamos colisões dentro do próprio conjunto gerado.
 *
 * Os seis registros de `demoRequests` (protocolos HGV-2026-00120 a
 * HGV-2026-00125) fazem parte da seed oficial e são somados aos gerados
 * abaixo para completar exatamente 100 registros, respeitando a
 * distribuição 32/27/18/13/10.
 */

const SEED_YEAR = 2026

interface CategorySeedSpec {
  id: RequestCategoryId
  /** Total oficial da categoria (demos + gerados). */
  totalCount: number
  addressPrefix: string
  description: string
}

const CATEGORY_SEED_SPECS: readonly CategorySeedSpec[] = [
  {
    id: "buracos-vias",
    totalCount: 32,
    addressPrefix: "Rua das Flores",
    description: "Buraco na via com risco para veículos e pedestres.",
  },
  {
    id: "iluminacao-publica",
    totalCount: 27,
    addressPrefix: "Av. Brasil",
    description: "Poste de iluminação pública apagado ou com defeito.",
  },
  {
    id: "descarte-irregular",
    totalCount: 18,
    addressPrefix: "Rua Ipiranga",
    description: "Descarte irregular de resíduos em via ou terreno público.",
  },
  {
    id: "poda-arvores",
    totalCount: 13,
    addressPrefix: "Rua dos Pinheiros",
    description: "Árvore com galhos precisando de poda.",
  },
  {
    id: "sinalizacao",
    totalCount: 10,
    addressPrefix: "Rua Marechal Deodoro",
    description: "Sinalização de trânsito danificada ou ausente.",
  },
]

function buildSeedDate(sequence: number): string {
  const month = ((sequence - 1) % 12) + 1
  const day = ((sequence - 1) % 28) + 1
  const mm = String(month).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${SEED_YEAR}-${mm}-${dd}`
}

function buildSeedStatus(sequence: number): RequestStatus {
  return REQUEST_STATUSES[sequence % REQUEST_STATUSES.length]
}

function buildSeedTimeline(
  status: RequestStatus,
  date: string,
): RequestTimelineEvent[] {
  const statusIndex = REQUEST_STATUSES.indexOf(status)
  // Meio-dia UTC fixo: mantém a geração determinística sem depender da hora
  // atual, e evita que a conversão para o fuso local desloque o dia exibido.
  const occurredAt = `${date}T12:00:00.000Z`
  return REQUEST_STATUSES.slice(0, statusIndex + 1).map((s) => ({
    status: s,
    occurredAt,
  }))
}

function buildGeneratedRequest(
  sequence: number,
  spec: CategorySeedSpec,
): UrbanRequest {
  const status = buildSeedStatus(sequence)
  const date = buildSeedDate(sequence)
  const bairro = (sequence % 10) + 1

  return {
    id: `seed-${String(sequence).padStart(3, "0")}`,
    protocol: `HGV-${SEED_YEAR}-${String(sequence).padStart(5, "0")}`,
    categoryId: spec.id,
    address: `${spec.addressPrefix}, ${100 + sequence} — Bairro ${bairro}`,
    description: spec.description,
    date,
    status,
    timeline: buildSeedTimeline(status, date),
  }
}

function groupDemosByCategory(): Map<RequestCategoryId, UrbanRequest[]> {
  const grouped = new Map<RequestCategoryId, UrbanRequest[]>()
  for (const demo of demoRequests) {
    const list = grouped.get(demo.categoryId) ?? []
    list.push(demo)
    grouped.set(demo.categoryId, list)
  }
  return grouped
}

function buildSeedRequests(): UrbanRequest[] {
  const demosByCategory = groupDemosByCategory()
  const requests: UrbanRequest[] = []
  let sequence = 1

  for (const spec of CATEGORY_SEED_SPECS) {
    const demosForCategory = demosByCategory.get(spec.id) ?? []
    const generatedCount = spec.totalCount - demosForCategory.length

    for (let i = 0; i < generatedCount; i++) {
      requests.push(buildGeneratedRequest(sequence, spec))
      sequence++
    }

    requests.push(...demosForCategory)
  }

  return requests
}

export const seedRequests: readonly UrbanRequest[] = buildSeedRequests()
