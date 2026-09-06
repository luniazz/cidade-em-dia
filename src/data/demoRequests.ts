import type { UrbanRequest } from "../domain/requests"

/**
 * Seis registros de demonstração usados nas apresentações do produto. Fazem
 * parte da seed oficial (`seedRequests.ts`) e preservam os protocolos
 * históricos HGV-2026-00120 a HGV-2026-00125. Nenhuma tela deve importar
 * este módulo diretamente — apenas `seedRequests.ts`.
 */
export const demoRequests: UrbanRequest[] = [
  {
    id: "1",
    protocol: "HGV-2026-00125",
    categoryId: "buracos-vias",
    address: "Rua das Flores, 320 — Bairro Centro",
    reference: "Em frente ao Supermercado Extra",
    description:
      "Buraco de aproximadamente 50cm de diâmetro no meio da pista, causando risco aos motoristas e ciclistas.",
    name: "Maria Aparecida Santos",
    email: "maria.santos@example.com",
    date: "2026-08-28",
    status: "execucao",
    photo:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format",
    timeline: [
      { status: "recebida", occurredAt: "2026-08-28T12:14:00.000Z" },
      {
        status: "analise",
        occurredAt: "2026-08-29T17:30:00.000Z",
        note: "Equipe de vistoria acionada.",
      },
      {
        status: "programada",
        occurredAt: "2026-09-01T11:00:00.000Z",
        note: "Serviço agendado para 04/09.",
      },
      { status: "execucao", occurredAt: "2026-09-04T10:45:00.000Z" },
    ],
    adminNote: "Equipe alocada. Previsão de conclusão: 05/09/2026.",
  },
  {
    id: "2",
    protocol: "HGV-2026-00124",
    categoryId: "iluminacao-publica",
    address: "Av. Brasil, 1450 — Bairro Jardim Novo",
    reference: "Próximo à Escola Municipal João XXIII",
    description:
      "Três postes consecutivos apagados há mais de uma semana, deixando a rua escura à noite.",
    name: "Carlos Eduardo Oliveira",
    email: "carlos.oliveira@example.com",
    date: "2026-08-27",
    status: "programada",
    timeline: [
      { status: "recebida", occurredAt: "2026-08-27T23:05:00.000Z" },
      { status: "analise", occurredAt: "2026-08-28T13:00:00.000Z" },
      {
        status: "programada",
        occurredAt: "2026-09-02T12:15:00.000Z",
        note: "Manutenção agendada.",
      },
    ],
  },
  {
    id: "3",
    protocol: "HGV-2026-00123",
    categoryId: "descarte-irregular",
    address: "Rua Ipiranga, 78 — Bairro Vila Operária",
    reference: "Terreno baldio na esquina com Rua Pará",
    description:
      "Grande quantidade de entulho e lixo doméstico descartados irregularmente no terreno.",
    name: "Ana Paula Ferreira",
    email: "anapaula@example.com",
    date: "2026-08-25",
    status: "resolvida",
    timeline: [
      { status: "recebida", occurredAt: "2026-08-25T14:30:00.000Z" },
      { status: "analise", occurredAt: "2026-08-26T12:00:00.000Z" },
      { status: "programada", occurredAt: "2026-08-27T17:00:00.000Z" },
      { status: "execucao", occurredAt: "2026-08-29T10:00:00.000Z" },
      {
        status: "resolvida",
        occurredAt: "2026-08-29T18:40:00.000Z",
        note: "Área limpa. Placa de proibição instalada.",
      },
    ],
  },
  {
    id: "4",
    protocol: "HGV-2026-00122",
    categoryId: "sinalizacao",
    address: "Rua Marechal Deodoro, 560 — Bairro São Lucas",
    reference: "Cruzamento com Rua Sete de Setembro",
    description:
      "Placa de PARE completamente amassada e ilegível após acidente.",
    name: "João Batista Lima",
    email: "joao.lima@example.com",
    date: "2026-08-24",
    status: "analise",
    timeline: [
      { status: "recebida", occurredAt: "2026-08-24T20:20:00.000Z" },
      { status: "analise", occurredAt: "2026-08-25T12:10:00.000Z" },
    ],
  },
  {
    id: "5",
    protocol: "HGV-2026-00121",
    categoryId: "poda-arvores",
    address: "Rua dos Pinheiros, 210 — Bairro Parque Verde",
    reference: "Em frente à residência número 210",
    description:
      "Galhos de árvore grande obstruindo fiação elétrica e parte da calçada.",
    name: "Fernanda Costa Ribeiro",
    email: "fernanda.ribeiro@example.com",
    date: "2026-08-23",
    status: "recebida",
    timeline: [{ status: "recebida", occurredAt: "2026-08-23T17:05:00.000Z" }],
  },
  {
    id: "6",
    protocol: "HGV-2026-00120",
    categoryId: "iluminacao-publica",
    address: "Av. Independência, 890 — Bairro Centro",
    reference: "Em frente à agência do Banco do Brasil",
    description:
      "Poste de iluminação apagado, deixando o trecho escuro à noite.",
    name: "Roberto Alves Mendes",
    email: "roberto.mendes@example.com",
    date: "2026-08-22",
    status: "resolvida",
    timeline: [
      { status: "recebida", occurredAt: "2026-08-22T11:30:00.000Z" },
      { status: "analise", occurredAt: "2026-08-23T13:00:00.000Z" },
      { status: "programada", occurredAt: "2026-08-25T17:00:00.000Z" },
      { status: "execucao", occurredAt: "2026-08-28T10:00:00.000Z" },
      {
        status: "resolvida",
        occurredAt: "2026-08-28T19:00:00.000Z",
        note: "Poste substituído e iluminação reestabelecida.",
      },
    ],
  },
]
