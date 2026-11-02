/** Superfície mínima de `window` usada aqui, injetável em testes. */
export interface PageShowTarget {
  addEventListener(type: "pageshow", listener: (event: Event) => void): void
  removeEventListener(type: "pageshow", listener: (event: Event) => void): void
}

/**
 * Chama `callback` quando o navegador restaura a página do back/forward cache
 * (bfcache). Nessa restauração o JavaScript não é reexecutado: o estado do
 * React volta exatamente como estava, mesmo que o armazenamento tenha mudado
 * depois (ex.: logout feito em outro documento do histórico).
 *
 * Retorna a função que remove o listener.
 */
export function onPageRestoredFromCache(
  target: PageShowTarget,
  callback: () => void,
): () => void {
  const listener = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) callback()
  }
  target.addEventListener("pageshow", listener)
  return () => target.removeEventListener("pageshow", listener)
}
