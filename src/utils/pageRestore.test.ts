import { describe, expect, it, vi } from "vitest"
import { onPageRestoredFromCache } from "./pageRestore"

function pageShowEvent(persisted: boolean): Event {
  const event = new Event("pageshow")
  Object.defineProperty(event, "persisted", { value: persisted })
  return event
}

describe("onPageRestoredFromCache", () => {
  it("chama o callback quando a página é restaurada do bfcache", () => {
    const target = new EventTarget()
    const callback = vi.fn()
    onPageRestoredFromCache(target, callback)

    target.dispatchEvent(pageShowEvent(true))

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("ignora o carregamento normal da página", () => {
    const target = new EventTarget()
    const callback = vi.fn()
    onPageRestoredFromCache(target, callback)

    target.dispatchEvent(pageShowEvent(false))

    expect(callback).not.toHaveBeenCalled()
  })

  it("para de escutar após a remoção do listener", () => {
    const target = new EventTarget()
    const callback = vi.fn()
    const unsubscribe = onPageRestoredFromCache(target, callback)

    unsubscribe()
    target.dispatchEvent(pageShowEvent(true))

    expect(callback).not.toHaveBeenCalled()
  })
})
