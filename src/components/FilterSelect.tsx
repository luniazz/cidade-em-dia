import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"

interface FilterSelectProps {
  /** Rótulo acessível (o select não tem rótulo visível). */
  label: string
  value: string
  onChange(value: string): void
  children: ReactNode
}

/** Select compacto usado nos filtros administrativos. */
export default function FilterSelect({
  label,
  value,
  onChange,
  children,
}: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="text-xs rounded-lg border pl-3 pr-7 py-1.5 appearance-none"
        style={{
          borderColor: "var(--cd-border)",
          // Fundo explícito, como no select do detalhe: o navegador pinta a
          // lista aberta com ele; transparente cai no branco padrão.
          backgroundColor: "var(--cd-surface)",
          fontFamily: "var(--font-display)",
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  )
}
