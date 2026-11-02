import { Link, useLocation } from "react-router"
import { AlertCircle, UserRound } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { USER_ROLE_LABELS } from "../domain/auth"
import type { AccessDeniedState } from "../components/RequireAuth"

export default function Perfil() {
  const { user } = useAuth()
  const location = useLocation()
  const accessDenied = Boolean(
    (location.state as AccessDeniedState | null)?.accessDenied,
  )

  // A rota é protegida por <RequireAuth>; o retorno é só uma salvaguarda.
  if (!user) return null

  const rows = [
    { label: "Nome", value: user.name },
    { label: "E-mail", value: user.email },
    { label: "Perfil", value: USER_ROLE_LABELS[user.role] },
  ]

  return (
    <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="text-sm mb-6 flex items-center gap-1"
        style={{ color: "var(--cd-blue)", fontFamily: "var(--font-display)" }}
      >
        ← Voltar ao início
      </Link>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
      >
        Meu perfil
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Dados da conta de demonstração conectada.
      </p>

      {accessDenied && (
        <div
          role="alert"
          className="rounded-xl border p-4 mb-6 flex items-start gap-3"
          style={{ borderColor: "var(--cd-danger-border)", backgroundColor: "var(--cd-danger-bg)" }}
        >
          <AlertCircle
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: "var(--cd-danger)" }}
          />
          <div>
            <p
              className="font-semibold text-sm mb-0.5"
              style={{ color: "var(--cd-danger)", fontFamily: "var(--font-display)" }}
            >
              Acesso restrito
            </p>
            <p className="text-xs text-red-600">
              A Área da Prefeitura é exclusiva para servidores públicos. Seu
              perfil atual não possui essa permissão.
            </p>
          </div>
        </div>
      )}

      <div
        className="bg-white rounded-xl border p-6"
        style={{ borderColor: "var(--cd-border)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--cd-mist)" }}
          >
            <UserRound size={24} style={{ color: "var(--cd-navy)" }} />
          </div>
          <p
            className="font-bold text-lg"
            style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
          >
            {user.name}
          </p>
        </div>

        <dl className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-gray-500 mb-0.5">{row.label}</dt>
              <dd
                className="text-sm font-medium wrap-break-word"
                style={{ color: "var(--cd-ink)" }}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  )
}
