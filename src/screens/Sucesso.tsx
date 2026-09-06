import {
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router"
import type { UrbanRequest } from "../domain/requests"
import { getRequestCategoryLabel } from "../domain/requests"
import { formatDateOnlyPtBR } from "../utils/date"
import { RequestServiceError, requestService } from "../services/requestService"
import StatusBadge from "../components/StatusBadge"

type AsyncStatus = "loading" | "not-found" | "error" | "found"
type LoadStatus = "missing" | AsyncStatus

/**
 * `location.state` é preenchido só pela navegação vinda do cadastro (nunca
 * pela URL) e some num F5 — por isso é lido de forma defensiva, nunca
 * tratado como garantidamente presente ou no formato esperado.
 */
function readPhotoSaveFailed(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    "photoSaveFailed" in state &&
    (state as { photoSaveFailed?: unknown }).photoSaveFailed === true
  )
}

function copyWithFallback(text: string): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let succeeded = false
  try {
    succeeded = document.execCommand("copy")
  } catch {
    succeeded = false
  }
  document.body.removeChild(textarea)
  return succeeded
}

export default function Sucesso() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const protocolo = searchParams.get("protocolo")
  const photoSaveFailed = readPhotoSaveFailed(location.state)

  const [asyncStatus, setAsyncStatus] = useState<AsyncStatus>("loading")
  const [request, setRequest] = useState<UrbanRequest | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Sem protocolo na query string não há o que buscar — esse caso é
    // derivado diretamente durante a renderização.
    if (!protocolo) return

    let cancelled = false
    // Reseta para "loading" ao trocar de protocolo (não na primeira
    // renderização, já coberta pelo estado inicial) — o padrão usual de
    // busca de dados assíncrona dentro de um efeito.
    // oxlint-disable-next-line react/set-state-in-effect
    setAsyncStatus("loading")

    requestService
      .getByProtocol(protocolo)
      .then((found) => {
        if (cancelled) return
        if (found) {
          setRequest(found)
          setAsyncStatus("found")
        } else {
          setAsyncStatus("not-found")
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMessage(
          err instanceof RequestServiceError
            ? err.message
            : "Não foi possível consultar a solicitação agora.",
        )
        setAsyncStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [protocolo])

  const status: LoadStatus = protocolo ? asyncStatus : "missing"

  const copy = async () => {
    if (!request) return
    let succeeded = false
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(request.protocol)
        succeeded = true
      } else {
        succeeded = copyWithFallback(request.protocol)
      }
    } catch {
      succeeded = copyWithFallback(request.protocol)
    }

    if (succeeded) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (status === "loading") {
    return (
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-sm text-gray-500">Consultando solicitação...</p>
      </main>
    )
  }

  if (status === "missing" || status === "not-found" || status === "error") {
    const title =
      status === "missing"
        ? "Nenhum protocolo informado"
        : status === "not-found"
          ? "Solicitação não encontrada"
          : "Não foi possível consultar"
    const description =
      status === "missing"
        ? "Acesse esta página a partir da confirmação de uma solicitação registrada, ou consulte pelo protocolo na tela de acompanhamento."
        : status === "not-found"
          ? "Verifique o link utilizado ou consulte novamente pelo protocolo na tela de acompanhamento."
          : (errorMessage ??
            "Tente novamente em instantes ou consulte pelo protocolo na tela de acompanhamento.")

    return (
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <AlertCircle size={32} style={{ color: "#DC2626" }} strokeWidth={2} />
        </div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <p className="text-sm text-gray-500 mb-8">{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to="/acompanhar"
            className="flex-1 py-3 rounded-lg text-sm font-semibold text-center"
            style={{
              backgroundColor: "#243F73",
              color: "white",
              fontFamily: "var(--font-display)",
            }}
          >
            Acompanhar solicitação
          </Link>
          <Link
            to="/"
            className="flex-1 py-3 rounded-lg border text-sm font-semibold text-center"
            style={{
              borderColor: "#DCE5F7",
              color: "#5978B5",
              fontFamily: "var(--font-display)",
            }}
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  // status === "found"
  const found = request as UrbanRequest

  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "#D1FAE5" }}
      >
        <CheckCircle2 size={32} style={{ color: "#059669" }} strokeWidth={2} />
      </div>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
      >
        Solicitação registrada!
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Sua solicitação foi recebida com sucesso. Guarde o protocolo abaixo para
        acompanhar o atendimento.
      </p>

      {photoSaveFailed && (
        <div
          className="w-full rounded-xl border p-3 mb-6 flex items-center gap-2"
          style={{ borderColor: "#FDE68A", backgroundColor: "#FFFBEB" }}
        >
          <AlertCircle size={14} style={{ color: "#D97706" }} />
          <p className="text-xs text-left" style={{ color: "#92400E" }}>
            Sua solicitação foi registrada, mas não foi possível salvar a foto.
            Guarde o protocolo para acompanhamento.
          </p>
        </div>
      )}

      {/* Protocol box */}
      <div
        className="w-full rounded-xl border p-6 mb-8"
        style={{ backgroundColor: "#F6F8FC", borderColor: "#DCE5F7" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
        >
          Número de protocolo
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span
            className="text-2xl sm:text-3xl font-extrabold tracking-tight break-all"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            {found.protocol}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
            style={{
              borderColor: "#DCE5F7",
              color: copied ? "#059669" : "#5978B5",
              backgroundColor: copied ? "#D1FAE5" : "white",
              fontFamily: "var(--font-display)",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span aria-live="polite">{copied ? "Copiado!" : "Copiar"}</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div
        className="w-full rounded-xl border divide-y text-left mb-8"
        style={{ borderColor: "#DCE5F7" }}
      >
        {[
          {
            label: "Categoria",
            val: getRequestCategoryLabel(found.categoryId),
          },
          { label: "Endereço", val: found.address },
          {
            label: "Data de abertura",
            val: formatDateOnlyPtBR(found.date) ?? "Data inválida",
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center px-4 py-3"
          >
            <span className="text-xs text-gray-500">{row.label}</span>
            <span
              className="text-sm font-medium text-right max-w-[55%]"
              style={{ color: "#1a2535", fontFamily: "var(--font-display)" }}
            >
              {row.val}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-xs text-gray-500">Status</span>
          <StatusBadge status={found.status} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          to={`/solicitacao/${found.protocol}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
          style={{
            backgroundColor: "#243F73",
            color: "white",
            fontFamily: "var(--font-display)",
          }}
        >
          Ver detalhes
          <ArrowRight size={16} />
        </Link>
        <Link
          to="/"
          className="flex-1 py-3 rounded-lg border text-sm font-semibold text-center"
          style={{
            borderColor: "#DCE5F7",
            color: "#5978B5",
            fontFamily: "var(--font-display)",
          }}
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
