# Cidade em Dia

Cidade em Dia é uma aplicação web desenvolvida para facilitar o registro e o acompanhamento de solicitações de zeladoria urbana.

O cidadão pode registrar problemas encontrados na cidade, receber um protocolo único e acompanhar o andamento da solicitação.

A aplicação também possui uma área administrativa para consulta das solicitações, atualização de status, observações, filtros, paginação e visualização de indicadores.

## Funcionalidades

### Área do cidadão

- Registro de solicitações de zeladoria urbana
- Geração automática de protocolo
- Consulta de solicitação pelo protocolo
- Upload opcional de imagem
- Acompanhamento do status
- Visualização do histórico de atualizações

### Área administrativa

- Listagem das solicitações cadastradas
- Consulta dos detalhes de cada solicitação
- Filtro por categoria
- Filtro por status
- Paginação das solicitações
- Atualização de status
- Registro de observações
- Visualização do histórico da solicitação
- Indicadores administrativos
- Gráficos por categoria e período

## Categorias disponíveis

As solicitações podem ser registradas nas seguintes categorias:

- Buracos em vias
- Iluminação pública
- Descarte irregular de resíduos
- Poda de árvores
- Sinalização

## Status das solicitações

Uma solicitação pode possuir os seguintes status:

- Recebida
- Em análise
- Programada
- Em execução
- Resolvida

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide React
- Vitest

## Como executar

### Requisitos

É necessário ter instalado:

- Node.js
- npm

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
```

### 2. Acesse a pasta do projeto

```bash
cd <NOME_DA_PASTA>
```

### 3. Instale as dependências

```bash
npm ci
```

O comando `npm ci` instala as versões registradas no `package-lock.json`.

### 4. Inicie a aplicação

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:8443
```

## Como utilizar

### Cidadão

1. Acesse a aplicação.
2. Clique em **Registrar solicitação**.
3. Escolha a categoria do problema.
4. Informe o endereço.
5. Descreva a situação encontrada.
6. Opcionalmente, adicione uma imagem.
7. Envie a solicitação.
8. Guarde o protocolo gerado.

Para consultar posteriormente, acesse **Acompanhar solicitação** e informe o protocolo.

### Administração

A área administrativa está disponível em:

```text
http://localhost:8443/admin
```

Nela é possível:

- visualizar as solicitações cadastradas;
- filtrar por categoria e status;
- navegar pelas solicitações utilizando paginação;
- acessar os detalhes de uma solicitação;
- atualizar o status;
- adicionar observações;
- acompanhar o histórico;
- visualizar indicadores e gráficos.


