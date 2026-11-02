import { describe, expect, it } from "vitest"
import { ADMIN_ROLES, resolveRouteAccess } from "./auth"
import type { RequestFilters, RequestListState } from "./requestListing"
import {
  changeRequestListFilters,
  filterRequests,
  getRequestListBackPath,
  paginate,
  parseRequestListParams,
  sortRequestsByDate,
  toRequestListParams,
} from "./requestListing"
import type { UrbanRequest } from "./requests"

function request(overrides: Partial<UrbanRequest>): UrbanRequest {
  return {
    id: overrides.protocol ?? "id",
    protocol: "HGV-2026-00001",
    categoryId: "buracos-vias",
    address: "Rua das Flores, 10",
    description: "Buraco grande na pista.",
    date: "2026-01-01",
    status: "recebida",
    timeline: [],
    ...overrides,
  }
}

const requests: UrbanRequest[] = [
  request({ protocol: "HGV-2026-00001", date: "2026-03-01" }),
  request({
    protocol: "HGV-2026-00002",
    categoryId: "iluminacao-publica",
    address: "Avenida Brasil, 500",
    description: "Poste apagado há uma semana.",
    status: "analise",
    date: "2026-01-15",
    name: "Maria Souza",
    email: "maria@exemplo.com",
  }),
  request({
    protocol: "HGV-2026-00003",
    status: "resolvida",
    date: "2026-03-01",
  }),
]

const noFilters: RequestFilters = { query: "", status: "all", categoryId: "all" }
const protocols = (items: UrbanRequest[]) => items.map((r) => r.protocol)

describe("filterRequests", () => {
  it("filtra por status", () => {
    expect(
      protocols(filterRequests(requests, { ...noFilters, status: "analise" })),
    ).toEqual(["HGV-2026-00002"])
  })

  it("filtra por categoria", () => {
    expect(
      protocols(
        filterRequests(requests, { ...noFilters, categoryId: "buracos-vias" }),
      ),
    ).toEqual(["HGV-2026-00001", "HGV-2026-00003"])
  })

  it("busca por protocolo sem diferenciar maiúsculas", () => {
    expect(
      protocols(filterRequests(requests, { ...noFilters, query: "hgv-2026-00003" })),
    ).toEqual(["HGV-2026-00003"])
  })

  it("busca em endereço, descrição, nome e e-mail, ignorando acentos", () => {
    const search = (query: string) =>
      protocols(filterRequests(requests, { ...noFilters, query }))

    expect(search("avenida brasil")).toEqual(["HGV-2026-00002"])
    expect(search("POSTE APAGADO")).toEqual(["HGV-2026-00002"])
    expect(search("maria souza")).toEqual(["HGV-2026-00002"])
    expect(search("maria@exemplo")).toEqual(["HGV-2026-00002"])
    expect(search("ha uma semana")).toEqual(["HGV-2026-00002"])
  })

  it("combina busca e filtros", () => {
    expect(
      protocols(
        filterRequests(requests, {
          query: "rua das flores",
          status: "resolvida",
          categoryId: "buracos-vias",
        }),
      ),
    ).toEqual(["HGV-2026-00003"])
  })
})

describe("sortRequestsByDate", () => {
  it("ordena por data; na mesma data, a registrada depois é mais recente", () => {
    expect(protocols(sortRequestsByDate(requests, "recentes"))).toEqual([
      "HGV-2026-00003",
      "HGV-2026-00001",
      "HGV-2026-00002",
    ])
    expect(protocols(sortRequestsByDate(requests, "antigas"))).toEqual([
      "HGV-2026-00002",
      "HGV-2026-00001",
      "HGV-2026-00003",
    ])
  })
})

describe("paginate", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)

  it("recorta a página pedida e informa os totais", () => {
    expect(paginate(items, 3, 10)).toEqual({
      items: [21, 22, 23],
      page: 3,
      totalPages: 3,
      total: 23,
      firstItem: 21,
      lastItem: 23,
    })
  })

  it("limita a página ao intervalo válido", () => {
    expect(paginate(items, 99, 10).page).toBe(3)
    expect(paginate(items, 0, 10).page).toBe(1)
    expect(paginate([], 2, 10)).toMatchObject({
      page: 1,
      totalPages: 1,
      firstItem: 0,
    })
  })
})

describe("estado da listagem", () => {
  const state: RequestListState = {
    query: "rua",
    status: "analise",
    categoryId: "all",
    sort: "antigas",
    page: 4,
  }

  it("volta para a página 1 ao mudar busca, filtro ou ordenação", () => {
    expect(changeRequestListFilters(state, { status: "resolvida" })).toEqual({
      ...state,
      status: "resolvida",
      page: 1,
    })
    expect(changeRequestListFilters(state, { query: "avenida" }).page).toBe(1)
  })

  it("faz o caminho de ida e volta pela URL", () => {
    const params = toRequestListParams(state)
    expect(params.toString()).toBe("busca=rua&status=analise&ordem=antigas&pagina=4")
    expect(parseRequestListParams(params)).toEqual(state)
  })

  it("ignora valores inválidos na URL", () => {
    expect(
      parseRequestListParams(
        new URLSearchParams("status=x&categoria=y&ordem=z&pagina=-2"),
      ),
    ).toEqual({
      query: "",
      status: "all",
      categoryId: "all",
      sort: "recentes",
      page: 1,
    })
  })

  it("o voltar do detalhe preserva a visão da listagem", () => {
    expect(getRequestListBackPath({ listSearch: "?status=analise" })).toBe(
      "/admin/solicitacoes?status=analise",
    )
    expect(getRequestListBackPath(null)).toBe("/admin/solicitacoes")
    expect(getRequestListBackPath({ listSearch: "//externo" })).toBe(
      "/admin/solicitacoes",
    )
  })
})

describe("proteção de /admin/solicitacoes", () => {
  // A rota fica no mesmo grupo <RequireAuth allowedRoles={ADMIN_ROLES}> das
  // demais rotas administrativas no App.
  it("aplica a mesma regra das rotas administrativas", () => {
    const base = { id: "x", name: "X", email: "x@x.com" }
    expect(resolveRouteAccess(null, ADMIN_ROLES)).toBe("login-required")
    expect(resolveRouteAccess({ ...base, role: "cidadao" }, ADMIN_ROLES)).toBe(
      "forbidden",
    )
    expect(resolveRouteAccess({ ...base, role: "atendente" }, ADMIN_ROLES)).toBe(
      "allowed",
    )
  })
})
