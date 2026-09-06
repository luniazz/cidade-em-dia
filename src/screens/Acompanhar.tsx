import { useState } from "react"
import { Link } from "react-router"
import { Search, AlertCircle, ArrowRight } from "lucide-react"
import type { UrbanRequest } from "../domain/requests"
import { getRequestCategoryLabel } from "../domain/requests"
import { formatDateOnlyPtBR } from "../utils/date"
import { RequestServiceError, requestService } from "../services/requestService"
import StatusBadge from "../components/StatusBadge"

export default function Acompanhar() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<UrbanRequest | null | undefined>(
    undefined,
  )
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searching) return
    setSearched(true)
    setSearching(true)
    setError(null)
    try {
      const found = await requestService.getByProtocol(query)
      setResult(found)
    } catch (err) {
      setResult(undefined)
      setError(
        err instanceof RequestServiceError
          ? err.message
          : "Não foi possível consultar o protocolo agora. Tente novamente.",
      )
    } finally {
      setSearching(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <Link
        to="/"
        className="text-sm mb-6 flex items-center gap-1"
        style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
      >
        ← Voltar ao início
      </Link>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
      >
        Acompanhar solicitação
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Informe o número de protocolo para consultar o status do atendimento.
      </p>

      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <label htmlFor="protocolo-busca" className="sr-only">
              Número de protocolo
            </label>
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="protocolo-busca"
              type="text"
              placeholder="Ex: HGV-2026-00125"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm"
              style={{ borderColor: "#DCE5F7", backgroundColor: "white" }}
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "#243F73",
              color: "white",
              fontFamily: "var(--font-display)",
            }}
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </form>

      {/* Hint */}
      <p className="text-xs text-gray-500 mt-3">
        Dica: use o protocolo{" "}
        <button
          type="button"
          className="underline"
          onClick={() => setQuery("HGV-2026-00125")}
        >
          HGV-2026-00125
        </button>{" "}
        para ver um exemplo.
      </p>

      {searching && (
        <p className="mt-6 text-sm text-gray-500">Consultando protocolo...</p>
      )}

      {error && (
        <div
          className="mt-8 rounded-xl border p-6 flex flex-col items-center text-center gap-3"
          style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <AlertCircle size={24} style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: "#DC2626", fontFamily: "var(--font-display)" }}
            >
              Não foi possível consultar
            </p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {!searching && !error && searched && result === null && (
        <div
          className="mt-8 rounded-xl border p-6 flex flex-col items-center text-center gap-3"
          style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <AlertCircle size={24} style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: "#DC2626", fontFamily: "var(--font-display)" }}
            >
              Protocolo não encontrado
            </p>
            <p className="text-xs text-red-600">
              Verifique o número de protocolo e tente novamente.
            </p>
          </div>
        </div>
      )}

      {!searching && result && (
        <div
          className="mt-8 rounded-xl border overflow-hidden"
          style={{ borderColor: "#DCE5F7" }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ backgroundColor: "#F6F8FC" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
              >
                Protocolo
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
              >
                {result.protocol}
              </p>
            </div>
            <StatusBadge status={result.status} />
          </div>

          <div className="divide-y bg-white">
            {[
              {
                label: "Categoria",
                val: getRequestCategoryLabel(result.categoryId),
              },
              { label: "Endereço", val: result.address },
              {
                label: "Data de abertura",
                val: formatDateOnlyPtBR(result.date) ?? "Data inválida",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center px-5 py-3"
              >
                <span className="text-xs text-gray-500">{row.label}</span>
                <span
                  className="text-sm font-medium text-right max-w-[55%]"
                  style={{
                    color: "#1a2535",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {row.val}
                </span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4" style={{ backgroundColor: "#F6F8FC" }}>
            <Link
              to={`/solicitacao/${result.protocol}`}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
            >
              Ver detalhes completos <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
