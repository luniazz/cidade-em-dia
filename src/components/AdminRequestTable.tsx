import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"
import type { UrbanRequest } from "../domain/requests"
import { getRequestCategoryLabel } from "../domain/requests"
import { formatDateOnlyPtBR } from "../utils/date"
import StatusBadge from "./StatusBadge"

interface AdminRequestTableProps {
  items: readonly UrbanRequest[]
  loading: boolean
  error: string | null
  /** Mensagem exibida quando não há itens para mostrar. */
  emptyMessage: ReactNode
  /** Nome acessível da região rolável da tabela. */
  ariaLabel: string
  /** Estado de navegação repassado ao detalhe (ex.: para o link de voltar). */
  linkState?: unknown
}

const HEADERS = ["Protocolo", "Categoria", "Endereço", "Data", "Status", ""]

/**
 * Listagem administrativa de solicitações com estados de carga, erro e vazio:
 * tabela a partir de `md` e cards empilhados em telas menores.
 */
export default function AdminRequestTable({
  items,
  loading,
  error,
  emptyMessage,
  ariaLabel,
  linkState,
}: AdminRequestTableProps) {
  const stateMessage: { content: ReactNode; danger: boolean } | null = loading
    ? { content: "Carregando solicitações...", danger: false }
    : error
      ? { content: error, danger: true }
      : items.length === 0
        ? { content: emptyMessage, danger: false }
        : null
  const detailPath = (req: UrbanRequest) => `/admin/solicitacao/${req.protocol}`
  const linkStyle = {
    color: "var(--cd-blue)",
    fontFamily: "var(--font-display)",
  }

  const message = (content: ReactNode, danger = false) => (
    <tr>
      <td
        colSpan={HEADERS.length}
        className={`px-4 py-8 text-center text-sm ${danger ? "" : "text-gray-500"}`}
        style={danger ? { color: "var(--cd-danger)" } : undefined}
      >
        {content}
      </td>
    </tr>
  )

  return (
    <>
      <div
        className="hidden md:block overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
      >
        <table className="w-full text-sm min-w-160">
          <thead>
            <tr style={{ backgroundColor: "var(--cd-page)" }}>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-600 border-b"
                  style={{
                    borderColor: "var(--cd-border)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {stateMessage
              ? message(stateMessage.content, stateMessage.danger)
              : items.map((req) => (
                      <tr key={req.id}>
                        <td
                          className="px-4 py-3 font-mono text-xs font-medium"
                          style={{ color: "var(--cd-navy)" }}
                        >
                          {req.protocol}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {getRequestCategoryLabel(req.categoryId)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">
                          {req.address}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDateOnlyPtBR(req.date) ?? "Data inválida"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={detailPath(req)}
                            state={linkState}
                            className="text-xs font-medium flex items-center gap-1"
                            style={linkStyle}
                          >
                            Ver <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards empilhados, sem rolagem horizontal */}
      <div className="md:hidden">
        {stateMessage ? (
          <p
            className={`px-5 py-8 text-center text-sm ${stateMessage.danger ? "" : "text-gray-500"}`}
            style={stateMessage.danger ? { color: "var(--cd-danger)" } : undefined}
          >
            {stateMessage.content}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cd-border)]">
            {items.map((req) => (
              <li key={req.id} className="px-5 py-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: "var(--cd-navy)" }}
                  >
                    {req.protocol}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-xs text-gray-600">
                  {getRequestCategoryLabel(req.categoryId)} ·{" "}
                  {formatDateOnlyPtBR(req.date) ?? "Data inválida"}
                </p>
                <p className="text-xs text-gray-500 wrap-break-word">
                  {req.address}
                </p>
                <Link
                  to={detailPath(req)}
                  state={linkState}
                  className="text-xs font-medium flex items-center gap-1 self-start"
                  style={linkStyle}
                >
                  Ver detalhes <ArrowRight size={12} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
