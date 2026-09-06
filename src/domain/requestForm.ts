import type { RequestCategoryId } from "./requests"

/** Estado tipado do formulário de nova solicitação. */
export interface RequestFormValues {
  categoryId: RequestCategoryId | ""
  address: string
  reference: string
  description: string
  name: string
  email: string
  privacyAccepted: boolean
}

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ADDRESS_MIN_LENGTH = 5
const DESCRIPTION_MIN_LENGTH = 10

export function createEmptyRequestFormValues(): RequestFormValues {
  return {
    categoryId: "",
    address: "",
    reference: "",
    description: "",
    name: "",
    email: "",
    privacyAccepted: false,
  }
}

/**
 * Validação pura do formulário. Categoria, endereço e descrição são
 * obrigatórios (endereço com pelo menos 5 caracteres após trim, descrição com
 * pelo menos 10); nome e e-mail são opcionais (o e-mail só é validado quando
 * preenchido).
 */
export function validateRequestForm(
  values: RequestFormValues,
): RequestFormErrors {
  const errors: RequestFormErrors = {}

  if (!values.categoryId) {
    errors.categoryId = "Selecione uma categoria."
  }
  const address = values.address.trim()
  if (!address) {
    errors.address = "Informe o endereço."
  } else if (address.length < ADDRESS_MIN_LENGTH) {
    errors.address = `Informe um endereço com pelo menos ${ADDRESS_MIN_LENGTH} caracteres.`
  }

  const description = values.description.trim()
  if (!description) {
    errors.description = "Descreva o problema."
  } else if (description.length < DESCRIPTION_MIN_LENGTH) {
    errors.description = `Descreva o problema com pelo menos ${DESCRIPTION_MIN_LENGTH} caracteres.`
  }
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "E-mail inválido."
  }
  if (!values.privacyAccepted) {
    errors.privacyAccepted = "Aceite os termos para continuar."
  }

  return errors
}
