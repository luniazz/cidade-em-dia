import { MapPinOff } from "lucide-react"
import { Link } from "react-router"

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "#DCE5F7" }}
      >
        <MapPinOff size={32} style={{ color: "#243F73" }} strokeWidth={2} />
      </div>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
      >
        Página não encontrada
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        O endereço acessado não existe ou foi movido.
      </p>

      <Link
        to="/"
        className="py-3 px-6 rounded-lg text-sm font-semibold"
        style={{
          backgroundColor: "#243F73",
          color: "white",
          fontFamily: "var(--font-display)",
        }}
      >
        Voltar ao início
      </Link>
    </main>
  )
}
