import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { attachmentService } from "../services/attachmentService"

interface Props {
  /** `UrbanRequest.id` — chave usada pelo `attachmentService`. */
  requestId: string
  /** Foto legada de registros de demonstração (`UrbanRequest.photo`), usada só como fallback. */
  legacyPhotoUrl?: string
  /** "public" (telas do cidadão) preserva a moldura com borda; "admin" já fica dentro de um card com borda própria. */
  variant?: "public" | "admin"
}

type LoadState = "loading" | "found" | "absent" | "error"

/**
 * Concentra a consulta ao `attachmentService`, o ciclo da Object URL e os
 * três resultados possíveis (imagem encontrada, ausência normal, falha de
 * leitura) — nenhuma tela acessa IndexedDB diretamente. A falta ou falha da
 * foto nunca esconde o restante da tela: o componente só ocupa a área da
 * imagem.
 */
export default function RequestAttachment({
  requestId,
  legacyPhotoUrl,
  variant = "public",
}: Props) {
  const [state, setState] = useState<LoadState>("loading")
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Reseta para "loading" ao trocar de requestId (não na primeira
    // renderização, já coberta pelo estado inicial) — o padrão usual de
    // busca de dados assíncrona dentro de um efeito.
    // oxlint-disable-next-line react/set-state-in-effect
    setState("loading")
    setObjectUrl(null)

    attachmentService
      .getByRequestId(requestId)
      .then((record) => {
        if (cancelled) return
        if (record) {
          setObjectUrl(URL.createObjectURL(record.blob))
          setState("found")
        } else {
          // Ausência é normal: a solicitação simplesmente não tem foto
          // persistida (nunca teve, ou a criação da foto falhou).
          setState("absent")
        }
      })
      .catch(() => {
        if (cancelled) return
        // Diferente de "absent": aqui a consulta em si falhou, não sabemos
        // se existe uma foto ou não.
        setState("error")
      })

    return () => {
      cancelled = true
    }
  }, [requestId])

  // Revoga a Object URL do Blob encontrado ao trocar de requestId, ao
  // desmontar, ou quando uma nova consulta substituir a URL atual.
  useEffect(() => {
    if (!objectUrl) return
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (state === "loading") return null

  const imgClassName =
    variant === "admin"
      ? "w-full h-40 object-cover"
      : "w-full h-52 object-cover"

  const frame = (children: React.ReactNode) =>
    variant === "admin" ? (
      children
    ) : (
      <div
        className="mb-6 rounded-xl overflow-hidden border"
        style={{ borderColor: "#DCE5F7" }}
      >
        {children}
      </div>
    )

  const noticeClassName =
    variant === "admin"
      ? "px-5 py-3 text-xs flex items-center gap-1.5"
      : "mt-2 mb-6 text-xs flex items-center gap-1.5"

  if (state === "found" && objectUrl) {
    return frame(
      <img src={objectUrl} alt="Foto do problema" className={imgClassName} />,
    )
  }

  if (state === "absent") {
    if (legacyPhotoUrl) {
      return frame(
        <img
          src={legacyPhotoUrl}
          alt="Foto do problema"
          className={imgClassName}
        />,
      )
    }
    // Sem foto persistida e sem foto legada: não há nada para mostrar, e
    // isso não é um erro.
    return null
  }

  // state === "error": a leitura falhou. A URL legada, se existir, ainda
  // pode ser mostrada como fallback visual, mas o aviso discreto de falha
  // continua aparecendo — o fallback funcionar não apaga o erro real.
  return (
    <>
      {legacyPhotoUrl &&
        frame(
          <img
            src={legacyPhotoUrl}
            alt="Foto do problema"
            className={imgClassName}
          />,
        )}
      <p className={noticeClassName} style={{ color: "#9CA3AF" }}>
        <AlertCircle size={12} />
        Não foi possível consultar a foto armazenada localmente.
      </p>
    </>
  )
}
