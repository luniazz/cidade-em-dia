import type { Page } from "../domain/requestListing"

interface RequestPaginationProps {
  page: Page<unknown>
  onPageChange(page: number): void
}

const buttonClass =
  "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors enabled:cursor-pointer enabled:hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
const buttonStyle = {
  borderColor: "var(--cd-border)",
  color: "var(--cd-blue)",
  fontFamily: "var(--font-display)",
}

/** Rodapé de paginação das listagens administrativas. */
export default function RequestPagination({
  page,
  onPageChange,
}: RequestPaginationProps) {
  if (page.total === 0) return null

  return (
    <div
      className="px-5 py-3 border-t flex items-center justify-between flex-wrap gap-3"
      style={{ borderColor: "var(--cd-border)" }}
    >
      <p className="text-xs text-gray-500">
        Mostrando {page.firstItem}–{page.lastItem} de {page.total}
      </p>
      {page.totalPages > 1 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={page.page <= 1}
            onClick={() => onPageChange(page.page - 1)}
            className={buttonClass}
            style={buttonStyle}
          >
            Anterior
          </button>
          <p
            className="text-xs"
            style={{
              color: "var(--cd-navy)",
              fontFamily: "var(--font-display)",
            }}
          >
            Página {page.page} de {page.totalPages}
          </p>
          <button
            type="button"
            disabled={page.page >= page.totalPages}
            onClick={() => onPageChange(page.page + 1)}
            className={buttonClass}
            style={buttonStyle}
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  )
}
