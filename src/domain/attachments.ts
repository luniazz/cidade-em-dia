/**
 * Modelo de domínio do anexo de imagem de uma solicitação. O binário (Blob)
 * e o metadado mínimo vivem juntos aqui; `mimeType` e `size` nunca são
 * duplicados no registro — quem precisar deles lê `record.blob.type` e
 * `record.blob.size` diretamente, evitando dois valores que poderiam
 * divergir do próprio Blob.
 *
 * Este módulo não acessa IndexedDB, React ou qualquer camada de
 * persistência: é só tipo + validação pura, usada tanto pela UI (para
 * feedback imediato) quanto pelo `attachmentService` (que revalida antes de
 * gravar).
 */

export interface AttachmentRecord {
  requestId: string
  blob: Blob
  fileName: string
  /** Instante ISO 8601 em que o anexo foi salvo. */
  createdAt: string
}

/** Única fonte para os formatos aceitos. Não é uma alegação de segurança — apenas validação de entrada e UX. */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type AllowedAttachmentMimeType = typeof ALLOWED_ATTACHMENT_MIME_TYPES[number]

/** Valor pronto para o atributo `accept` do `<input type="file">`. */
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_MIME_TYPES.join(",")

/** Única fonte para o tamanho máximo aceito (5 MiB). */
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024

export type AttachmentValidationErrorCode = "invalid-format" | "too-large" | "empty-file"

const ATTACHMENT_VALIDATION_MESSAGES: Record<AttachmentValidationErrorCode, string> =
  {
    "invalid-format": "Selecione uma imagem nos formatos JPG, PNG ou WebP.",
    "too-large": "A imagem deve ter no máximo 5 MB.",
    "empty-file": "A imagem selecionada está vazia.",
  }

export interface AttachmentValidationError {
  code: AttachmentValidationErrorCode
  message: string
}

/**
 * Resultado tipado da validação — nunca um booleano isolado, para que quem
 * chama saiba exatamente qual das três causas rejeitou o arquivo.
 */
export type AttachmentValidationResult = { valid: true } | {
  valid: false
  error: AttachmentValidationError
}

function isAllowedAttachmentMimeType(
  value: string,
): value is AllowedAttachmentMimeType {
  return ALLOWED_ATTACHMENT_MIME_TYPES.some((mime) => mime === value)
}

/**
 * Validação pura do arquivo selecionado. `accept` no input é só uma
 * orientação do seletor de arquivos do sistema operacional — o navegador não
 * garante que o arquivo escolhido respeite esse filtro, então o tipo e o
 * tamanho são sempre revalidados aqui, tanto na seleção quanto antes do
 * cadastro e novamente dentro do `attachmentService`.
 */
export function validateAttachmentFile(file: {
  type: string
  size: number
}): AttachmentValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: {
        code: "empty-file",
        message: ATTACHMENT_VALIDATION_MESSAGES["empty-file"],
      },
    }
  }

  if (!isAllowedAttachmentMimeType(file.type)) {
    return {
      valid: false,
      error: {
        code: "invalid-format",
        message: ATTACHMENT_VALIDATION_MESSAGES["invalid-format"],
      },
    }
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "too-large",
        message: ATTACHMENT_VALIDATION_MESSAGES["too-large"],
      },
    }
  }

  return { valid: true }
}
