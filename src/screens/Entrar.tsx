import { useState } from "react"
import { Link, Navigate, useLocation } from "react-router"
import { AlertCircle, MapPin } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import type { LoginRedirectState } from "../components/RequireAuth"
import { AuthServiceError } from "../services/authService"
import { isSafeRedirectPath } from "../domain/auth"

function getRedirectTarget(state: unknown): string {
  const from = (state as LoginRedirectState | null)?.from
  return isSafeRedirectPath(from) ? from : "/"
}

export default function Entrar() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Usuário já autenticado (inclusive logo após o login) volta para a
  // aplicação: para a rota que o trouxe até aqui ou para o início.
  if (user) {
    return <Navigate to={getRedirectTarget(location.state)} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    if (!email.trim() || !password) {
      setError("Informe o e-mail e a senha.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(
        err instanceof AuthServiceError
          ? err.message
          : "Não foi possível entrar agora. Tente novamente.",
      )
      setSubmitting(false)
    }
  }

  const inputClass = "w-full rounded-lg border px-3.5 py-2.5 text-sm"
  const inputStyle = {
    borderColor: error ? "#EF4444" : "var(--cd-border)",
    backgroundColor: "var(--cd-surface)",
  }
  const labelStyle = { color: "var(--cd-navy)", fontFamily: "var(--font-display)" }

  return (
    <main className="w-full max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div
        className="bg-white rounded-xl border p-6 sm:p-8"
        style={{ borderColor: "var(--cd-border)" }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: "var(--cd-primary)" }}
          >
            <MapPin size={22} color="white" strokeWidth={2.5} />
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--cd-navy)", fontFamily: "var(--font-display)" }}
          >
            Entrar no Cidade em Dia
          </h1>
          <p className="text-sm text-gray-500">
            O login é opcional para registrar e acompanhar solicitações.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <div>
            <label
              htmlFor="entrar-email"
              className="block text-sm font-semibold mb-1.5"
              style={labelStyle}
            >
              E-mail
            </label>
            <input
              id="entrar-email"
              type="email"
              autoComplete="username"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "entrar-erro" : undefined}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="entrar-senha"
              className="block text-sm font-semibold mb-1.5"
              style={labelStyle}
            >
              Senha
            </label>
            <input
              id="entrar-senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "entrar-erro" : undefined}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {error && (
            <p
              id="entrar-erro"
              role="alert"
              className="flex items-center gap-1 text-xs text-red-500"
            >
              <AlertCircle size={12} /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--cd-primary)",
              color: "white",
              fontFamily: "var(--font-display)",
            }}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <Link
        to="/"
        className="text-sm mt-6 flex items-center justify-center gap-1"
        style={{ color: "var(--cd-blue)", fontFamily: "var(--font-display)" }}
      >
        ← Voltar ao início
      </Link>
    </main>
  )
}
