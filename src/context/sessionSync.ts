import type { AuthUser } from "../domain/auth"
import type { AuthService } from "../services/authService"
import type { PageShowTarget } from "../utils/pageRestore"
import { onPageRestoredFromCache } from "../utils/pageRestore"

export interface SessionSyncHandlers {
  /** A sessão será relida; a interface deve ocultar o usuário atual. */
  onRevalidating(): void
  /** Resultado da leitura da sessão salva. */
  onSessionResolved(user: AuthUser | null): void
}

/**
 * Mantém o estado de autenticação alinhado com a sessão salva:
 * - lê a sessão ao iniciar;
 * - relê quando outra aba altera a sessão (evento `storage`);
 * - relê quando a página volta do bfcache, avisando antes por
 *   `onRevalidating` para que o usuário antigo não continue visível.
 *
 * Retorna a função que remove todos os listeners.
 */
export function startSessionSync(
  service: AuthService,
  pageTarget: PageShowTarget,
  handlers: SessionSyncHandlers,
): () => void {
  let active = true

  const revalidate = () => {
    void service.getCurrentUser().then((user) => {
      if (active) handlers.onSessionResolved(user)
    })
  }

  const stopPageRestore = onPageRestoredFromCache(pageTarget, () => {
    handlers.onRevalidating()
    revalidate()
  })
  const stopSessionChange = service.onSessionChange(revalidate)
  revalidate()

  return () => {
    active = false
    stopPageRestore()
    stopSessionChange()
  }
}
