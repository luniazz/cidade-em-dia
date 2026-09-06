import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import {
  LayoutDashboard,
  ChevronDown,
  Save,
  CheckCircle2,
  LogOut,
  ClipboardList,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import type { UrbanRequest, RequestStatus } from "../domain/requests"
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  getRequestCategoryLabel,
  isRequestStatus,
} from "../domain/requests"
import { formatDateOnlyPtBR, formatDateTimePtBR } from "../utils/date"
import { RequestServiceError, requestService } from "../services/requestService"
import StatusBadge from "../components/StatusBadge"
import RequestAttachment from "../components/RequestAttachment"

type AsyncLoadStatus = "loading" | "not-found" | "error" | "found"
type LoadStatus = "missing" | AsyncLoadStatus

export default function AdminDetalhe() {
  const { protocolo } = useParams<{ protocolo: string }>()

  const [asyncLoadStatus, setAsyncLoadStatus] =
    useState<AsyncLoadStatus>("loading")
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [request, setRequest] = useState<UrbanRequest | null>(null)
  const [status, setStatus] = useState<RequestStatus>("recebida")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    // Sem protocolo na URL não há o que buscar — esse caso é derivado
    // diretamente durante a renderização.
    if (!protocolo) return

    let cancelled = false
    // Reseta para "loading" ao trocar de protocolo (não na primeira
    // renderização, já coberta pelo estado inicial) — o padrão usual de
    // busca de dados assíncrona dentro de um efeito.
    // oxlint-disable-next-line react/set-state-in-effect
    setAsyncLoadStatus("loading")

    requestService
      .getByProtocol(protocolo)
      .then((found) => {
        if (cancelled) return
        if (found) {
          setRequest(found)
          setStatus(found.status)
          setAsyncLoadStatus("found")
        } else {
          setAsyncLoadStatus("not-found")
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadErrorMessage(
          err instanceof RequestServiceError
            ? err.message
            : "Não foi possível consultar a solicitação agora.",
        )
        setAsyncLoadStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [protocolo])

  const loadStatus: LoadStatus = protocolo ? asyncLoadStatus : "missing"

  const handleSave = async () => {
    if (saving || !request) return
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const updated = await requestService.updateStatus(request.protocol, {
        status,
        note,
      })
      const changed = updated.timeline.length > request.timeline.length
      setRequest(updated)
      setNote("")
      if (changed) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      setSaveError(
        err instanceof RequestServiceError
          ? err.message
          : "Não foi possível salvar a atualização agora. Tente novamente.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loadStatus !== "found" || !request) {
    const title =
      loadStatus === "missing"
        ? "Protocolo não informado"
        : loadStatus === "not-found"
          ? "Solicitação não encontrada"
          : loadStatus === "error"
            ? "Não foi possível consultar"
            : null

    return (
      <div className="flex min-h-screen" style={{ backgroundColor: "#F6F8FC" }}>
        <div className="flex-1 min-w-0">
          <header
            className="bg-white border-b px-6 py-4 flex items-center gap-4"
            style={{ borderColor: "#DCE5F7" }}
          >
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
            >
              <ArrowLeft size={16} />
              Painel
            </Link>
          </header>
          <div className="p-4 sm:p-6 max-w-2xl">
            {loadStatus === "loading" ? (
              <p className="text-sm text-gray-500">
                Consultando solicitação...
              </p>
            ) : (
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
                    style={{
                      color: "#DC2626",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {title}
                  </p>
                  <p className="text-xs text-red-600">
                    {loadStatus === "error"
                      ? (loadErrorMessage ?? "Tente novamente em instantes.")
                      : "Verifique o protocolo e volte ao painel."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F6F8FC" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 border-r shrink-0"
        style={{ backgroundColor: "#243F73", borderColor: "#1d3460" }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: "#1d3460" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
              <LayoutDashboard size={14} color="white" />
            </div>
            <span
              className="text-white font-bold text-sm"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Cidade em Dia
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "#7A9ED4" }}>
            Área da Prefeitura
          </p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard" },
            { icon: ClipboardList, label: "Solicitações" },
          ].map((item) => (
            <Link
              key={item.label}
              to="/admin"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ color: "#7A9ED4", fontFamily: "var(--font-display)" }}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: "#1d3460" }}>
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full hover:bg-white/10"
            style={{ color: "#7A9ED4", fontFamily: "var(--font-display)" }}
          >
            <LogOut size={15} />
            Sair
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <header
          className="bg-white border-b px-6 py-4 flex items-center gap-4"
          style={{ borderColor: "#DCE5F7" }}
        >
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
          >
            <ArrowLeft size={16} />
            Painel
          </Link>
          <span className="text-gray-300">/</span>
          <h1
            className="text-sm font-bold"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            {request.protocol}
          </h1>
        </header>

        <div className="p-4 sm:p-6 max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: details */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Request info */}
            <div
              className="bg-white rounded-xl border"
              style={{ borderColor: "#DCE5F7" }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "#DCE5F7" }}
              >
                <h2
                  className="text-sm font-semibold"
                  style={{
                    color: "#243F73",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Dados da solicitação
                </h2>
                <StatusBadge status={request.status} />
              </div>
              <RequestAttachment
                requestId={request.id}
                legacyPhotoUrl={request.photo}
                variant="admin"
              />
              <div className="divide-y">
                {[
                  {
                    label: "Categoria",
                    val: getRequestCategoryLabel(request.categoryId),
                  },
                  { label: "Endereço", val: request.address },
                  {
                    label: "Ponto de referência",
                    val: request.reference || "—",
                  },
                  { label: "Descrição", val: request.description },
                  {
                    label: "Data de abertura",
                    val: formatDateOnlyPtBR(request.date) ?? "Data inválida",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <span className="text-xs text-gray-500 sm:col-span-1">
                      {row.label}
                    </span>
                    <span
                      className="text-xs sm:col-span-2"
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
            </div>

            {/* Citizen data */}
            <div
              className="bg-white rounded-xl border"
              style={{ borderColor: "#DCE5F7" }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: "#DCE5F7" }}
              >
                <h2
                  className="text-sm font-semibold"
                  style={{
                    color: "#243F73",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Dados do cidadão
                </h2>
              </div>
              <div className="divide-y">
                {[
                  { label: "Nome", val: request.name || "Não informado" },
                  { label: "E-mail", val: request.email || "Não informado" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span
                      className="text-xs sm:col-span-2"
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
            </div>

            {/* History */}
            <div
              className="bg-white rounded-xl border"
              style={{ borderColor: "#DCE5F7" }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: "#DCE5F7" }}
              >
                <h2
                  className="text-sm font-semibold"
                  style={{
                    color: "#243F73",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Histórico
                </h2>
              </div>
              <div className="px-5 py-5">
                <div className="flex flex-col gap-4">
                  {request.timeline.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: "#5978B5" }}
                      />
                      <div>
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: "#243F73",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {REQUEST_STATUS_LABELS[ev.status]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTimePtBR(ev.occurredAt) ?? "Data inválida"}
                        </p>
                        {ev.note && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ev.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: status update */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div
              className="bg-white rounded-xl border p-5"
              style={{ borderColor: "#DCE5F7" }}
            >
              <h2
                className="text-sm font-semibold mb-4"
                style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
              >
                Atualizar status
              </h2>

              <label
                htmlFor="admin-detalhe-status"
                className="block text-xs font-semibold mb-1.5 text-gray-500"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Status atual
              </label>
              <div className="relative mb-4">
                <select
                  id="admin-detalhe-status"
                  value={status}
                  onChange={(e) => {
                    const value = e.target.value
                    if (isRequestStatus(value)) {
                      setStatus(value)
                    }
                  }}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm appearance-none pr-10"
                  style={{ borderColor: "#DCE5F7", backgroundColor: "white" }}
                >
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {REQUEST_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              <label
                htmlFor="admin-detalhe-nota"
                className="block text-xs font-semibold mb-1.5 text-gray-500"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Nota interna
              </label>
              <textarea
                id="admin-detalhe-nota"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Registre observações para a equipe..."
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm resize-none mb-4"
                style={{ borderColor: "#DCE5F7" }}
              />

              <div aria-live="polite">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                  style={{
                    backgroundColor: saved ? "#059669" : "#243F73",
                    color: "white",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {saved ? (
                    <>
                      <CheckCircle2 size={15} />
                      Salvo com sucesso!
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      {saving ? "Salvando..." : "Salvar atualização"}
                    </>
                  )}
                </button>
                {saveError && (
                  <p className="text-xs mt-2" style={{ color: "#DC2626" }}>
                    {saveError}
                  </p>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#DCE5F7", borderColor: "#A8BEE5" }}
            >
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
              >
                Protocolo
              </p>
              <p className="text-sm font-bold" style={{ color: "#243F73" }}>
                {request.protocol}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
