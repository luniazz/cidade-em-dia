import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import type { UrbanRequest } from "../domain/requests"
import {
  REQUEST_STATUS_LABELS,
  getRequestCategoryLabel,
} from "../domain/requests"
import { formatDateOnlyPtBR, formatDateTimePtBR } from "../utils/date"
import { RequestServiceError, requestService } from "../services/requestService"
import StatusBadge from "../components/StatusBadge"
import RequestAttachment from "../components/RequestAttachment"

type AsyncStatus = "loading" | "not-found" | "error" | "found"
type LoadStatus = "missing" | AsyncStatus

export default function Detalhes() {
  const { protocolo } = useParams<{ protocolo: string }>()

  const [asyncStatus, setAsyncStatus] = useState<AsyncStatus>("loading")
  const [request, setRequest] = useState<UrbanRequest | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Sem protocolo na URL não há o que buscar — esse caso é derivado
    // diretamente durante a renderização, sem passar pelo estado assíncrono.
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

  if (status === "loading") {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-sm text-gray-500">Consultando solicitação...</p>
      </main>
    )
  }

  if (status === "missing" || status === "not-found" || status === "error") {
    const title =
      status === "missing"
        ? "Protocolo não informado"
        : status === "not-found"
          ? "Solicitação não encontrada"
          : "Não foi possível consultar"
    const description =
      status === "missing"
        ? "Informe um protocolo válido na tela de acompanhamento."
        : status === "not-found"
          ? "Verifique o protocolo e tente novamente."
          : (errorMessage ?? "Tente novamente em instantes.")

    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link
          to="/acompanhar"
          className="text-sm mb-6 flex items-center gap-1"
          style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
        >
          ← Voltar
        </Link>
        <div
          className="rounded-xl border p-6 flex flex-col items-center text-center gap-3"
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
              {title}
            </p>
            <p className="text-xs text-red-600">{description}</p>
          </div>
        </div>
      </main>
    )
  }

  // status === "found"
  const found = request as UrbanRequest

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/acompanhar"
        className="text-sm mb-6 flex items-center gap-1"
        style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
      >
        ← Voltar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
          >
            Protocolo
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            {found.protocol}
          </h1>
        </div>
        <StatusBadge status={found.status} />
      </div>

      {/* Photo */}
      <RequestAttachment requestId={found.id} legacyPhotoUrl={found.photo} />

      {/* Info */}
      <div
        className="rounded-xl border overflow-hidden mb-8"
        style={{ borderColor: "#DCE5F7" }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ backgroundColor: "#F6F8FC", borderColor: "#DCE5F7" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Dados da solicitação
          </h2>
        </div>
        <div className="divide-y bg-white">
          {[
            {
              label: "Categoria",
              val: getRequestCategoryLabel(found.categoryId),
            },
            { label: "Endereço", val: found.address },
            ...(found.reference
              ? [{ label: "Ponto de referência", val: found.reference }]
              : []),
            { label: "Descrição", val: found.description },
            {
              label: "Data de abertura",
              val: formatDateOnlyPtBR(found.date) ?? "Data inválida",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <span className="text-xs text-gray-500 sm:col-span-1">
                {row.label}
              </span>
              <span
                className="text-sm sm:col-span-2"
                style={{ color: "#1a2535", fontFamily: "var(--font-display)" }}
              >
                {row.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "#DCE5F7" }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ backgroundColor: "#F6F8FC", borderColor: "#DCE5F7" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Histórico de atendimento
          </h2>
        </div>
        <div className="bg-white px-5 py-6">
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[15px] top-0 w-0.5 bottom-0"
              style={{ backgroundColor: "#DCE5F7" }}
            />

            <div className="flex flex-col gap-6">
              {found.timeline.map((event, index) => {
                // O último evento persistido é sempre o status atual. Cada
                // linha representa um evento real ocorrido — o mesmo status
                // pode aparecer mais de uma vez (ex.: uma regressão seguida
                // de novo avanço), e a timeline nunca é reconstruída a
                // partir de uma lista fixa de status.
                const isActive = index === found.timeline.length - 1

                return (
                  <div
                    key={`${event.status}-${event.occurredAt}-${index}`}
                    className="flex items-start gap-4 relative"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2"
                      style={{
                        backgroundColor: isActive ? "#243F73" : "#DCE5F7",
                        borderColor: isActive ? "#243F73" : "#5978B5",
                      }}
                    >
                      <CheckCircle2
                        size={14}
                        style={{ color: isActive ? "white" : "#5978B5" }}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="pt-0.5 flex-1">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: isActive ? "#243F73" : "#374151",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {REQUEST_STATUS_LABELS[event.status]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateTimePtBR(event.occurredAt) ??
                          "Data inválida"}
                      </p>
                      {event.note && (
                        <p
                          className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2 border"
                          style={{ borderColor: "#E5E7EB" }}
                        >
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
