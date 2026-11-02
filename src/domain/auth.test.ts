import { describe, expect, it } from "vitest"
import type { AuthUser } from "./auth"
import { ADMIN_ROLES, isSafeRedirectPath, resolveRouteAccess } from "./auth"

const cidadao: AuthUser = {
  id: "demo-cidadao",
  name: "João da Silva",
  email: "cidadao@cidadeemdia.com.br",
  role: "cidadao",
}
const atendente: AuthUser = {
  id: "demo-atendente",
  name: "Administrador",
  email: "admin@cidadeemdia.gov.br",
  role: "atendente",
}

// Mesmas regras usadas pelo <RequireAuth> nas rotas do App.
const PERFIL_ROLES = undefined
const ADMIN_ROUTE_ROLES = ADMIN_ROLES

describe("resolveRouteAccess", () => {
  it("visitante em /perfil precisa entrar", () => {
    expect(resolveRouteAccess(null, PERFIL_ROLES)).toBe("login-required")
  })

  it("visitante em /admin precisa entrar", () => {
    expect(resolveRouteAccess(null, ADMIN_ROUTE_ROLES)).toBe("login-required")
  })

  it("cidadão autenticado não acessa /admin", () => {
    expect(resolveRouteAccess(cidadao, ADMIN_ROUTE_ROLES)).toBe("forbidden")
    expect(resolveRouteAccess(cidadao, PERFIL_ROLES)).toBe("allowed")
  })

  it("atendente autenticado acessa /admin", () => {
    expect(resolveRouteAccess(atendente, ADMIN_ROUTE_ROLES)).toBe("allowed")
  })
})

describe("isSafeRedirectPath", () => {
  it("aceita caminhos internos gerados pelo RequireAuth", () => {
    expect(isSafeRedirectPath("/admin")).toBe(true)
    expect(isSafeRedirectPath("/admin/solicitacao/HGV-2026-00001")).toBe(true)
    expect(isSafeRedirectPath("/perfil?aba=1")).toBe(true)
  })

  it.each([
    undefined,
    "",
    "admin",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "https://evil.example",
    "javascript:alert(1)",
  ])("rejeita %j", (value) => {
    expect(isSafeRedirectPath(value)).toBe(false)
  })
})
