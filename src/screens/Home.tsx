import {
  Construction,
  Lightbulb,
  Trash2,
  Trees,
  TriangleAlert,
  ArrowRight,
  ClipboardList,
  Search,
  CheckCircle2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { REQUEST_CATEGORIES } from "../domain/requests"
import type { RequestCategoryId, UrbanRequest } from "../domain/requests"
import { deriveRequestAnalytics } from "../domain/requestAnalytics"
import { RequestServiceError, requestService } from "../services/requestService"

const CATEGORY_VISUALS = {
  "buracos-vias": {
    icon: Construction,
    desc: "Buracos e danos no pavimento",
    color: "#E85D3B",
    bg: "#FEF0EC",
  },
  "iluminacao-publica": {
    icon: Lightbulb,
    desc: "Postes apagados ou com defeito",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  "descarte-irregular": {
    icon: Trash2,
    desc: "Lixo ou entulho em local indevido",
    color: "#6B7280",
    bg: "#F3F4F6",
  },
  "poda-arvores": {
    icon: Trees,
    desc: "Galhos perigosos ou obstruindo vias",
    color: "#059669",
    bg: "#ECFDF5",
  },
  sinalizacao: {
    icon: TriangleAlert,
    desc: "Placas de trânsito danificadas",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
} satisfies Record<RequestCategoryId, {
  icon: typeof Construction
  desc: string
  color: string
  bg: string
}>

const categories = REQUEST_CATEGORIES.map((category) => ({
  ...category,
  ...CATEGORY_VISUALS[category.id],
}))

const steps = [
  {
    icon: ClipboardList,
    num: "01",
    title: "Registre o problema",
    desc: "Preencha o formulário com categoria, endereço e descrição. Você pode anexar uma foto.",
  },
  {
    icon: Search,
    num: "02",
    title: "Receba o protocolo",
    desc: "Ao enviar, você recebe um número de protocolo para consultar o andamento da solicitação.",
  },
  {
    icon: CheckCircle2,
    num: "03",
    title: "Acompanhe o atendimento",
    desc: "Use o número de protocolo para monitorar cada etapa, da análise à resolução.",
  },
]

export default function Home() {
  const [requests, setRequests] = useState<UrbanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    requestService
      .getAll()
      .then((all) => {
        if (cancelled) return
        setRequests(all)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(
          err instanceof RequestServiceError
            ? err.message
            : "Não foi possível carregar os indicadores agora.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const analytics =
    !loading && !loadError ? deriveRequestAnalytics(requests, new Date()) : null

  const stats = [
    {
      label: "Aguardando atendimento",
      val: analytics ? String(analytics.kpis.aguardandoAtendimento) : "—",
    },
    {
      label: "Em atendimento",
      val: analytics ? String(analytics.kpis.emAtendimento) : "—",
    },
    {
      label: "Resolvidas este mês",
      val: analytics ? String(analytics.kpis.resolvidasNoMes) : "—",
    },
    {
      label: "Total de solicitações",
      val: analytics ? String(analytics.kpis.totalSolicitacoes) : "—",
    },
  ]

  return (
    <main>
      {/* Hero */}
      <section
        className="py-16 sm:py-24"
        style={{ backgroundColor: "#243F73" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1
              className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ajude a cuidar da
              <br />
              <span style={{ color: "#A8BEE5" }}>nossa cidade</span>
            </h1>
            <p className="text-lg mb-8" style={{ color: "#BDD0EE" }}>
              Registre problemas urbanos como buracos, iluminação, descarte
              irregular e muito mais. Acompanhe cada etapa do atendimento de
              forma simples e transparente.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/nova-solicitacao"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: "#DCE5F7",
                  color: "#243F73",
                  fontFamily: "var(--font-display)",
                }}
              >
                Registrar solicitação
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/acompanhar"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border transition-all hover:bg-white/10"
                style={{
                  borderColor: "rgba(220,229,247,0.4)",
                  color: "#DCE5F7",
                  fontFamily: "var(--font-display)",
                }}
              >
                Acompanhar solicitação
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-b" style={{ borderColor: "#DCE5F7" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p
                  className="text-2xl font-bold"
                  style={{
                    color: "#243F73",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {s.val}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {loadError ? (
            <p className="text-xs text-gray-500 mt-3">
              Indicadores indisponíveis no momento.
            </p>
          ) : null}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16" style={{ backgroundColor: "#F6F8FC" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Como funciona
          </h2>
          <p className="text-sm text-gray-500 mb-10">
            Em três passos simples, você registra e acompanha sua solicitação no
            Cidade em Dia.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-xl p-6 border"
                style={{ borderColor: "#DCE5F7" }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#DCE5F7" }}
                  >
                    <step.icon size={20} style={{ color: "#243F73" }} />
                  </div>
                  <span
                    className="text-3xl font-extrabold leading-none mt-0.5"
                    style={{
                      color: "#DCE5F7",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3
                  className="font-semibold text-base mb-1"
                  style={{
                    color: "#243F73",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Tipos de solicitação
          </h2>
          <p className="text-sm text-gray-500 mb-10">
            Selecione a categoria que melhor descreve o problema.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/nova-solicitacao"
                className="group flex flex-col items-center text-center p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: "#DCE5F7", backgroundColor: cat.bg }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  <cat.icon size={22} style={{ color: cat.color }} />
                </div>
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{
                    color: "#1a2535",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {cat.label}
                </span>
                <span className="text-xs text-gray-400 mt-1 leading-tight">
                  {cat.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer strip */}
      <section className="py-14" style={{ backgroundColor: "#DCE5F7" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
            >
              Encontrou um problema na sua rua?
            </h2>
            <p className="text-sm" style={{ color: "#5978B5" }}>
              Registre agora e ajude a manter nossa cidade em dia.
            </p>
          </div>
          <Link
            to="/nova-solicitacao"
            className="whitespace-nowrap flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
            style={{
              backgroundColor: "#243F73",
              color: "white",
              fontFamily: "var(--font-display)",
            }}
          >
            Registrar solicitação
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  )
}
