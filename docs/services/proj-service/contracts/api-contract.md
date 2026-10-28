# Contrato da API — proj-service

Base path: `/api/v1/proj`. Todas as rotas exigem token JWT.

## 1. Convenções

- Requisições e respostas em `application/json`; erros em `application/problem+json` (ver §5).
- IDs são UUID gerados pelo servidor, nunca enviados pelo cliente.
- Datas em ISO-8601 UTC (`criadoEm`, `atualizadoEm`).
- Transições de status são idempotentes (§7). Um `DELETE` repetido depois de uma falha parcial completa
  sem erro, porque cada etapa de limpeza nos outros serviços é segura de repetir.

## 2. Autenticação, permissões e empresa

- Token Bearer obrigatório; sem token ou com token inválido, a resposta é `401`.
- Escopos: `proj:read` (listagem, detalhe, histórico, link de download), `proj:write` (criar, reabrir,
  avançar status) e `proj:delete` (exclusão do projeto e dos dados ligados a ele).
- A empresa dona dos dados vem sempre do claim do token e define o schema usado na requisição. Ela nunca
  é lida do path, da query ou do corpo.
- Um `projetoId` de outra empresa responde `404`, para não revelar que o projeto existe.

## 3. Headers

| Header | Direção | Observação |
|---|---|---|
| `Authorization: Bearer <jwt>` | requisição | obrigatório em todas as rotas |
| `X-Correlation-Id` | requisição (opcional) / resposta (sempre) | vai para os logs; é gerado se não vier |
| `Content-Type: application/problem+json` | resposta | respostas de erro |
| `X-Degraded: true` | resposta (condicional) | na listagem, quando algum dos serviços consultados (IMP, COMP, PUB) não respondeu. O corpo continua igual. |

## 4. Recursos

### 4.1 `POST /projetos` — criar projeto

Cria um projeto em `rascunho` para a empresa do token, emite `ProjectCreated` e devolve o projeto.

Escopo `proj:write`. Corpo:

```json
{ "nome": "Romance das Cidades", "descricao": "opcional" }
```

- `nome` é obrigatório, com no máximo 200 caracteres, e não pode ser vazio nem conter só espaços.
- `descricao` é opcional.
- `editoraId` não vem no corpo; é tirado da empresa do token.

Resposta `201 Created` com o `ProjetoDetail` (§6.1), `status = "rascunho"` e header
`Location: /api/v1/proj/projetos/{id}`.

Se `nome` estiver ausente ou vazio, a resposta é `400` (`urn:cordele:proj:validation`) e nada é gravado.

### 4.2 `GET /projetos` — biblioteca de projetos

Lista os projetos da empresa, da atividade mais recente para a mais antiga, com os dados que o card da
biblioteca mostra: status, contagem de capítulos e imagens (último manuscrito, no IMP), último resultado
do epubcheck (última publicação, no PUB), autor (metadados, no COMP) e última atividade. Os dados de
outros serviços são buscados em lote, uma chamada por serviço por página, nunca uma por projeto.

Escopo `proj:read`. Parâmetros:

| Parâmetro | Tipo | Padrão | Regra |
|---|---|---|---|
| `status` | string | — | opcional; um dos valores de status do projeto (§7). Valor desconhecido responde `400`. |
| `limit` | inteiro | 25 | entre 1 e 50; acima de 50 responde `400`. |
| `cursor` | string | — | opcional; o `nextCursor` da página anterior. Cursor corrompido ou ilegível responde `400`. |

Resposta `200 OK`:

```json
{
  "items": [ /* ProjetoCard[] */ ],
  "nextCursor": "eyJhdHVhbGl6YWRvRW0iOiIyMDI2LTA5LTAxVDEyOjAwOjAwWiIsImlkIjoiYWJjZC4uLiJ9"
}
```

- `nextCursor` é um cursor de keyset em base64, opaco para o cliente; é `null` na última página.
- Ordenação: `ultimaAtividadeEm` decrescente, desempate por `id` crescente. Páginas seguidas não se
  sobrepõem nem deixam buracos.
- Projeto sem manuscrito aparece com `totalCapitulos = 0` e `totalImagens = 0`.
- Se algum serviço consultado falhar, a listagem ainda devolve identidade e status de cada projeto, deixa
  os campos daquele serviço nulos e adiciona `X-Degraded: true`. A listagem nunca falha por causa disso.

### 4.3 `GET /projetos/{projetoId}` — detalhe

Junta identidade e status do projeto com o resumo do manuscrito (IMP), os metadados (COMP) e o histórico
de publicações (PUB).

Escopo `proj:read`. Resposta `200 OK` com `ProjetoDetail` (§6.1). Projeto inexistente na empresa responde
`404`. Se o PUB não responder, o detalhe vem com `publicationHistory = []` e `degraded = true`, mantendo
o status.

### 4.4 `GET /projetos/{projetoId}/publicacoes` — histórico de publicações

Histórico de publicações do projeto, da mais recente para a mais antiga, lido do PUB. Pode ser vazio.

Escopo `proj:read`. Resposta `200 OK` com `PublicacaoHistoryItem[]` (§6.3). `arquivoUrl` é `null` quando
o `epubcheckStatus` é `erros_criticos` ou `pendente`. Projeto de outra empresa ou inexistente: `404`.

### 4.5 `GET /projetos/{projetoId}/publicacoes/{publicacaoId}/download` — link de download

Devolve uma URL assinada de curta duração para o ePub no storage. O cliente abre a URL diretamente; o
PROJ nunca repassa os bytes. Quem assina é o PUB.

Escopo `proj:read`. Resposta `200 OK`:

```json
{ "publicacaoId": "uuid", "arquivoUrl": "https://storage.../romance-v2.epub?sig=...", "expiresAt": "2026-08-25T15:10:00Z" }
```

- Publicação com `epubcheckStatus` `erros_criticos` ou `pendente`: `409`
  (`urn:cordele:proj:artifact-not-available`).
- Publicação que não pertence ao projeto ou à empresa: `404`.

### 4.6 `DELETE /projetos/{projetoId}` — excluir projeto

Exclui o projeto e, antes disso, pede a cada serviço que apague os dados ligados a ele (registros e
arquivos no storage), das folhas para a raiz. Emite `ProjectDeleted` depois do commit.

Escopo `proj:delete`. Resposta `204 No Content`.

Ordem:

1. PUB apaga publicações e os arquivos ePub/PDF.
2. COMP apaga metadados e configuração de layout.
3. IMP apaga manuscritos, binários e imagens.
4. O PROJ apaga `projeto_editorial` (o histórico de status vai junto pela FK).

- Cada etapa pode ser repetida sem efeito colateral.
- Se qualquer etapa falhar, a exclusão para antes de apagar o projeto, que continua existindo, e a
  resposta é `502` (`urn:cordele:proj:erasure-failed`).
- Projeto inexistente na empresa: `404`.

### 4.7 `POST /projetos/{projetoId}/reopen` — reabrir para nova revisão

Ação do editor que volta um projeto `publicado` ou `com_erros` para `em_composicao`.

Escopo `proj:write`. Corpo vazio. Resposta `200 OK`.

- `publicado` ou `com_erros`: passa a `em_composicao` e emite `ProjectStatusChanged`.
- Já em `em_composicao`: `200` sem mudança.
- Em `rascunho`: `409` (`urn:cordele:proj:illegal-status-transition`).

### 4.8 `POST /projetos/{projetoId}/advance-status` — avançar status

Usado pelo PUB depois de uma exportação (e pelo IMP ao confirmar a estrutura) para avançar o status.
Corpo `{ "targetStatus": "publicado" }`. Resposta `200 OK` com `{ projetoId, newStatus, changed }`.
Regras em §7.

## 5. Erros

Todos os erros saem como `application/problem+json`. `type` é uma URN estável e `traceId` repete o
`X-Correlation-Id`.

| `type` | HTTP | Quando |
|---|---|---|
| `urn:cordele:proj:validation` | 400 | requisição malformada (nome ausente ou vazio, targetStatus desconhecido, filtro ou cursor inválido) |
| `urn:cordele:proj:illegal-status-transition` | 409 | transição fora da tabela (§7) |
| `urn:cordele:proj:artifact-not-available` | 409 | download de uma publicação sem arquivo válido |
| `urn:cordele:proj:erasure-failed` | 502 | uma etapa de limpeza em outro serviço falhou; exclusão abortada |
| `urn:cordele:proj:unauthorized` | 401 | token ausente ou inválido |
| `urn:cordele:proj:forbidden` | 403 | token válido sem o escopo necessário |
| `urn:cordele:proj:not-found` | 404 | projetoId ou publicacaoId fora da empresa |

Exemplo:

```json
{
  "type": "urn:cordele:proj:illegal-status-transition",
  "title": "Illegal project status transition",
  "status": 409,
  "detail": "Cannot advance from 'rascunho' to 'publicado'; composition must precede publication.",
  "instance": "/api/v1/proj/projetos/2f1c.../advance-status",
  "traceId": "8b1f...c2"
}
```

## 6. Schemas

### 6.1 `ProjetoDetail`

```json
{
  "id": "uuid",
  "editoraId": "uuid",
  "nome": "Romance das Cidades",
  "descricao": "opcional ou null",
  "status": "publicado",
  "criadoEm": "2026-06-10T09:00:00Z",
  "atualizadoEm": "2026-06-19T16:30:00Z",
  "manuscriptSummary": {
    "manuscritoId": "uuid | null",
    "nomeArquivo": "romance.docx",
    "formato": "docx",
    "totalCapitulos": 18,
    "totalImagens": 3,
    "trechosNaoParseados": 0,
    "criadoEm": "2026-06-10T09:05:00Z"
  },
  "metadata": { "autor": "Eliana Moraes" },
  "publicationHistory": [ "PublicacaoHistoryItem, ver §6.3" ],
  "degraded": false
}
```

- `status` é um de `rascunho`, `em_composicao`, `publicado`, `com_erros`. Só o PROJ escreve esse campo.
- `manuscriptSummary` é `null` enquanto o projeto não tem manuscrito importado.
- `metadata.autor` é `null` até o COMP ter metadados do projeto.
- `degraded` é `true` quando algum serviço consultado não respondeu.

### 6.2 `ProjetoCard`

```json
{
  "id": "uuid",
  "nome": "Romance das Cidades",
  "autor": "Eliana Moraes",
  "status": "publicado",
  "totalCapitulos": 18,
  "totalImagens": 3,
  "ultimoEpubcheckStatus": "avisos",
  "ultimaAtividadeEm": "2026-06-19T16:30:00Z",
  "criadoEm": "2026-06-10T09:00:00Z"
}
```

- `ultimoEpubcheckStatus` é `valido`, `avisos`, `erros_criticos`, `pendente` ou `null` (nunca exportado).
- `autor` é `null` até existirem metadados no COMP.

### 6.3 `PublicacaoHistoryItem`

```json
{
  "publicacaoId": "uuid",
  "projetoId": "uuid",
  "epubcheckStatus": "avisos",
  "totalErros": 0,
  "totalAvisos": 2,
  "erros": null,
  "arquivoUrl": "https://storage.../romance-v2.epub?sig=... | null",
  "criadoEm": "2026-06-19T16:30:00Z"
}
```

- `erros` é um resumo legível dos erros críticos (pode ser `null`).
- Na listagem, `arquivoUrl` é `null` quando não há arquivo para baixar. O link definitivo sai sempre do
  endpoint de download (§4.5).

## 7. Status do projeto

As regras de transição ficam no value object de status; controllers e adapters não as repetem.
`advanceTo` é o caminho usado por IMP e PUB para avançar; `reopen` é a única volta deliberada, feita pelo
editor.

Status possíveis: `rascunho`, `em_composicao`, `publicado`, `com_erros`.

| De | Para | Motivo | Via |
|---|---|---|---|
| `rascunho` | `em_composicao` | IMP confirma a estrutura | `advanceTo` |
| `em_composicao` | `publicado` | PUB exportou (válido ou com avisos) | `advanceTo` |
| `em_composicao` | `com_erros` | PUB exportou com erros críticos | `advanceTo` |
| `publicado` | `com_erros` | uma exportação posterior falhou | `advanceTo` |
| `com_erros` | `publicado` | uma exportação posterior deu certo | `advanceTo` |
| `publicado` | `em_composicao` | editor abre nova revisão | `reopen` |
| `com_erros` | `em_composicao` | editor corrige o projeto | `reopen` |

Sem mudança (`changed = false`, nenhum evento):

- o status pedido é igual ao atual;
- `advanceTo(em_composicao)` com o projeto já em `em_composicao`, `publicado` ou `com_erros`. O
  `advanceTo` nunca faz o status voltar; para voltar existe o `reopen`.

Rejeitado (`409` no REST, erro lançado para quem chama em processo):

- `advanceTo` para `publicado` ou `com_erros` com o projeto em `rascunho` (a composição vem antes);
- qualquer transição para `rascunho`, que só existe como estado inicial.

`targetStatus` fora de `em_composicao`, `publicado`, `com_erros` responde `400`.

Quando o status muda de fato, a mudança é gravada junto com uma linha em `projeto_status_historico`
(de, para, quem pediu) e é emitido exatamente um `ProjectStatusChanged`.
