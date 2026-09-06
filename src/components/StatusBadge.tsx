import type { RequestStatus } from "../domain/requests"
import { REQUEST_STATUS_LABELS } from "../domain/requests"

const classMap: Record<RequestStatus, string> = {
  recebida: "status-recebida",
  analise: "status-analise",
  programada: "status-programada",
  execucao: "status-execucao",
  resolvida: "status-resolvida",
}

export default function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classMap[status]}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  )
}
