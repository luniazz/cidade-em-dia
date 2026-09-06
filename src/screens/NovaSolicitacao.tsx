import { useEffect, useState, useRef } from "react"
import { Link, useNavigate } from "react-router"
import { Upload, X, ChevronDown, AlertCircle } from "lucide-react"
import { REQUEST_CATEGORIES, isRequestCategoryId } from "../domain/requests"
import type { RequestCategoryId, UrbanRequest } from "../domain/requests"
import {
  createEmptyRequestFormValues,
  validateRequestForm,
} from "../domain/requestForm"
import type {
  RequestFormErrors,
  RequestFormValues,
} from "../domain/requestForm"
import {
  ATTACHMENT_ACCEPT,
  validateAttachmentFile,
} from "../domain/attachments"
import { RequestServiceError, requestService } from "../services/requestService"
import { attachmentService } from "../services/attachmentService"

const CATEGORY_DESCRIPTIONS: Record<RequestCategoryId, string> = {
  "buracos-vias": "Buracos, afundamentos ou danos no pavimento",
  "iluminacao-publica": "Postes apagados ou com defeito",
  "descarte-irregular": "Lixo ou entulho em local indevido",
  "poda-arvores": "Árvores com galhos perigosos ou obstruindo vias",
  sinalizacao: "Placas de trânsito danificadas ou ausentes",
}

type TextFieldKey = "address" | "reference" | "description" | "name" | "email"

export default function NovaSolicitacao() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RequestFormValues>(
    createEmptyRequestFormValues(),
  )
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [errors, setErrors] = useState<RequestFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Revoga a Object URL de preview sempre que ela for trocada (novo arquivo),
  // zerada (remoção) ou quando o componente desmontar — nunca persistimos
  // essa URL, ela só existe enquanto o preview estiver na tela.
  useEffect(() => {
    if (!photoPreviewUrl) return
    return () => {
      URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  function setField<K extends keyof RequestFormValues>(
    key: K,
    value: RequestFormValues[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Permite selecionar o mesmo arquivo novamente depois de removê-lo.
    e.target.value = ""
    if (!file) return

    const validation = validateAttachmentFile(file)
    if (!validation.valid) {
      setPhotoError(validation.error.message)
      return
    }

    setPhotoError(null)
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setPhotoError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const errs = validateRequestForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (!isRequestCategoryId(form.categoryId)) return
    const categoryId = form.categoryId

    // Revalida o arquivo imediatamente antes do cadastro: a seleção já foi
    // validada, mas o arquivo pode ter mudado de estado (ex.: um objeto
    // File revogado) entre a escolha e o envio do formulário.
    if (photoFile) {
      const validation = validateAttachmentFile(photoFile)
      if (!validation.valid) {
        setPhotoError(validation.error.message)
        return
      }
    }

    setSubmitting(true)
    setSubmitError(null)

    let created: UrbanRequest
    try {
      created = await requestService.create({
        categoryId,
        address: form.address.trim(),
        description: form.description.trim(),
        reference: form.reference.trim() || undefined,
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
      })
    } catch (error) {
      setSubmitError(
        error instanceof RequestServiceError
          ? error.message
          : "Não foi possível registrar a solicitação agora. Tente novamente.",
      )
      setSubmitting(false)
      return
    }

    // A solicitação já foi criada e não pode ser refeita: uma falha ao
    // salvar a foto não deve gerar outro cadastro nem outro protocolo, só um
    // aviso transitório na tela de sucesso.
    let photoSaveFailed = false
    if (photoFile) {
      try {
        await attachmentService.save(created.id, photoFile)
      } catch {
        photoSaveFailed = true
      }
    }

    navigate(
      `/solicitacao/sucesso?protocolo=${created.protocol}`,
      photoSaveFailed ? { state: { photoSaveFailed: true } } : undefined,
    )
  }

  const field = (
    label: string,
    key: TextFieldKey,
    opts?: {
      type?: string
      placeholder?: string
      textarea?: boolean
      required?: boolean
    },
  ) => {
    const fieldId = `nova-solicitacao-${key}`
    const errorId = `${fieldId}-erro`
    const hasError = Boolean(errors[key])

    return (
      <div>
        <label
          htmlFor={fieldId}
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
        >
          {label}{" "}
          {opts?.required ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="text-gray-400 font-normal">(opcional)</span>
          )}
        </label>
        {opts?.textarea ? (
          <textarea
            id={fieldId}
            rows={4}
            placeholder={opts?.placeholder}
            value={form[key]}
            onChange={(e) => setField(key, e.target.value)}
            aria-required={opts?.required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm resize-none"
            style={{
              borderColor: errors[key] ? "#EF4444" : "#DCE5F7",
              backgroundColor: "white",
            }}
          />
        ) : (
          <input
            id={fieldId}
            type={opts?.type || "text"}
            placeholder={opts?.placeholder}
            value={form[key]}
            onChange={(e) => setField(key, e.target.value)}
            aria-required={opts?.required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm"
            style={{
              borderColor: errors[key] ? "#EF4444" : "#DCE5F7",
              backgroundColor: "white",
            }}
          />
        )}
        {errors[key] && (
          <p
            id={errorId}
            className="flex items-center gap-1 text-xs text-red-500 mt-1"
          >
            <AlertCircle size={12} /> {errors[key]}
          </p>
        )}
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="text-sm mb-6 flex items-center gap-1"
        style={{ color: "#5978B5", fontFamily: "var(--font-display)" }}
      >
        ← Voltar ao início
      </Link>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
      >
        Nova solicitação
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Preencha os dados abaixo para registrar um problema urbano.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Category */}
        <div>
          <label
            htmlFor="nova-solicitacao-categoria"
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Categoria <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="nova-solicitacao-categoria"
              value={form.categoryId}
              onChange={(e) => {
                const value = e.target.value
                setField("categoryId", isRequestCategoryId(value) ? value : "")
              }}
              aria-required="true"
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={
                errors.categoryId
                  ? "nova-solicitacao-categoria-erro"
                  : undefined
              }
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm appearance-none pr-10"
              style={{
                borderColor: errors.categoryId ? "#EF4444" : "#DCE5F7",
                backgroundColor: "white",
                color: form.categoryId ? "#1a2535" : "#9CA3AF",
              }}
            >
              <option value="">Selecione a categoria</option>
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
            />
          </div>
          {form.categoryId && (
            <p className="text-xs text-gray-500 mt-1">
              {CATEGORY_DESCRIPTIONS[form.categoryId]}
            </p>
          )}
          {errors.categoryId && (
            <p
              id="nova-solicitacao-categoria-erro"
              className="flex items-center gap-1 text-xs text-red-500 mt-1"
            >
              <AlertCircle size={12} /> {errors.categoryId}
            </p>
          )}
        </div>

        <div className="h-px" style={{ backgroundColor: "#DCE5F7" }} />

        {field("Endereço", "address", {
          placeholder: "Ex: Rua das Flores, 320 — Bairro Centro",
          required: true,
        })}
        <div>
          <label
            htmlFor="nova-solicitacao-reference"
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Ponto de referência{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            id="nova-solicitacao-reference"
            type="text"
            placeholder="Ex: Em frente ao supermercado"
            value={form.reference}
            onChange={(e) => setField("reference", e.target.value)}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm"
            style={{ borderColor: "#DCE5F7", backgroundColor: "white" }}
          />
        </div>

        {field("Descrição do problema", "description", {
          textarea: true,
          placeholder:
            "Descreva o problema com detalhes. Informações como tamanho, há quanto tempo existe e risco oferecem contexto à equipe.",
          required: true,
        })}

        {/* Photo upload */}
        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
          >
            Foto <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          {photoPreviewUrl ? (
            <div
              className="relative rounded-xl overflow-hidden border"
              style={{ borderColor: "#DCE5F7" }}
            >
              <img
                src={photoPreviewUrl}
                alt="Foto do problema"
                className="w-full h-40 object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                aria-label="Remover foto"
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 transition-colors hover:border-blue-mid"
              style={{ borderColor: "#DCE5F7" }}
            >
              <Upload size={24} style={{ color: "#5978B5" }} />
              <span className="text-sm text-gray-500">
                Clique para enviar uma foto
              </span>
              <span className="text-xs text-gray-500">
                JPG, PNG ou WebP até 5 MB
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={handleFile}
          />
          {photoError && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
              <AlertCircle size={12} /> {photoError}
            </p>
          )}
        </div>

        <div className="h-px" style={{ backgroundColor: "#DCE5F7" }} />

        {field("Nome completo", "name", { placeholder: "Seu nome" })}
        {field("E-mail", "email", {
          type: "email",
          placeholder: "seu@email.com",
        })}

        {/* Privacy */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "#F6F8FC", border: "1px solid #DCE5F7" }}
        >
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Os dados informados serão utilizados para identificação e
            acompanhamento da solicitação.
          </p>
          <label
            htmlFor="nova-solicitacao-privacidade"
            className="flex items-start gap-2 cursor-pointer"
          >
            <input
              id="nova-solicitacao-privacidade"
              type="checkbox"
              checked={form.privacyAccepted}
              onChange={(e) => setField("privacyAccepted", e.target.checked)}
              aria-required="true"
              aria-invalid={Boolean(errors.privacyAccepted)}
              aria-describedby={
                errors.privacyAccepted
                  ? "nova-solicitacao-privacidade-erro"
                  : undefined
              }
              className="mt-0.5 rounded border-gray-300 accent-navy"
              style={{ accentColor: "#243F73" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "#243F73", fontFamily: "var(--font-display)" }}
            >
              Li e concordo com o uso dos meus dados para esta solicitação.
            </span>
          </label>
          {errors.privacyAccepted && (
            <p
              id="nova-solicitacao-privacidade-erro"
              className="flex items-center gap-1 text-xs text-red-500 mt-1.5"
            >
              <AlertCircle size={12} /> {errors.privacyAccepted}
            </p>
          )}
        </div>

        {submitError && (
          <div
            className="rounded-xl border p-3 flex items-center gap-2"
            style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}
          >
            <AlertCircle size={14} style={{ color: "#DC2626" }} />
            <p className="text-xs" style={{ color: "#DC2626" }}>
              {submitError}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="flex-1 py-3 rounded-lg border text-sm font-semibold transition-all hover:bg-gray-50 text-center"
            style={{
              borderColor: "#DCE5F7",
              color: "#5978B5",
              fontFamily: "var(--font-display)",
            }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "#243F73",
              color: "white",
              fontFamily: "var(--font-display)",
            }}
          >
            {submitting ? "Enviando..." : "Enviar solicitação"}
          </button>
        </div>
      </form>
    </main>
  )
}
