import { defineConfig } from "vitest/config"

/**
 * Configuração isolada do Vitest (não reaproveita vite.config.ts, que carrega
 * plugins específicos de dev/build). Cobre somente testes unitários puros,
 * sem DOM.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Fixa o fuso horário do processo de teste para que a formatação de
    // instantes ISO (timeline, seed) seja determinística independentemente
    // do fuso da máquina que executa `npm run test`.
    env: { TZ: "UTC" },
  },
})
