# Integrações — proj-service

O PROJ conversa com os outros três serviços do Cordelê (IMP, COMP e PUB). Não há broker nem API de
terceiros. São dois sentidos:

- o que o PROJ oferece para os outros chamarem (criar projeto, checar se existe, avançar e reabrir status);
- o que o PROJ consulta nos outros (leituras da biblioteca e do detalhe) e o que pede para eles apagarem
  quando um projeto é excluído.

Do lado de fora, cada integração é uma porta no domínio com um adapter em `src/infrastructure`. O domínio
e os casos de uso não conhecem IMP, COMP ou PUB pelo nome.

## 1. O que o PROJ oferece

### 1.1 Criar projeto

`create({ titulo }): Promise<{ projetoId }>`

Chamado pelo IMP no fluxo de "criar e enviar manuscrito". Cria o projeto em `rascunho` na empresa de quem
chamou e emite `ProjectCreated`. `titulo` vira `projeto_editorial.nome`; no REST o mesmo campo se chama
`nome`. Valem as mesmas regras de validação do nome do REST.

### 1.2 Checar se um projeto existe

`exists(projetoId): Promise<boolean>`

Usado pelo IMP antes de ligar um manuscrito a um projeto. Só considera a empresa de quem chamou: um
projeto de outra empresa dá `false`.

### 1.3 Avançar status

`advanceTo({ projetoId, targetStatus }): Promise<{ projetoId, newStatus, changed }>`

Chamado pelo IMP com `em_composicao` (confirmação da estrutura) e pelo PUB com `publicado` ou `com_erros`
depois de uma exportação; pelo HTTP é o `POST /projetos/{id}/advance-status`.

- Só grava, registra histórico e emite `ProjectStatusChanged` quando o status muda de fato; caso
  contrário devolve `changed = false`.
- Pedir um status que já foi alcançado, ou `em_composicao` para um projeto que já passou da composição,
  não é erro: é um no-op. O `advanceTo` nunca faz o status voltar.
- Transição ilegal (por exemplo `rascunho → publicado`) lança `IllegalStatusTransitionError` e não muda
  nada.
- `solicitadoPor` no histórico e no evento identifica quem pediu (`imp`, `pub`, `comp`, `editor`,
  `system`).

### 1.4 Reabrir para revisão

`reopen(projetoId): Promise<{ projetoId, newStatus, changed }>`

Chamado pelo editor pelo REST (`POST /projetos/{id}/reopen`). Leva `publicado` ou `com_erros` para
`em_composicao`; é no-op se já estiver em `em_composicao`; rejeita a partir de `rascunho`.

## 2. Leituras feitas nos outros serviços

Todas são em lote: recebem o conjunto de `projetoId` da página, nunca um por vez. Se o serviço não
responder, a leitura degrada (campo nulo e `degraded = true`) em vez de falhar.

| Porta | Serviço | Endpoint | Se falhar |
|---|---|---|---|
| `ManuscriptSummaryPort.summaries(projetoIds)` | IMP | `POST /api/v1/imp/manuscripts/summaries` | contagens 0, `manuscriptSummary = null` |
| `ProjectMetadataPort.metadata(projetoIds)` | COMP | `POST /api/v1/comp/metadata/batch` | `autor = null` |
| `PublicationHistoryPort.latest(projetoIds)` | PUB | `POST /api/v1/pub/publications/latest-batch` | `ultimoEpubcheckStatus = null` |
| `PublicationHistoryPort.history(projetoId)` | PUB | `GET /api/v1/pub/projetos/{id}/publicacoes` | `publicationHistory = []` |
| `PublicationHistoryPort.signedDownloadUrl(...)` | PUB | `GET /api/v1/pub/projetos/{id}/publicacoes/{pubId}/download` | erro para o cliente |

- `summaries` traz, por projeto, o último manuscrito: `manuscritoId, nomeArquivo, formato,
  totalCapitulos, totalImagens, trechosNaoParseados, criadoEm`.
- `metadata` traz o autor, ausente enquanto o COMP não tiver metadados do projeto.
- O histórico de publicações vem ordenado por `criadoEm` decrescente, com os campos de
  `PublicacaoHistoryItem` do contrato da API. O PROJ não guarda publicações.

## 3. Exclusão nos outros serviços

No `DELETE /projetos/{id}` o PROJ pede a limpeza a cada serviço, das folhas para a raiz, antes de apagar
o próprio registro. Cada serviço apaga os seus registros e arquivos.

| Ordem | Porta | Serviço | Endpoint | Apaga |
|---|---|---|---|---|
| 1 | `PublicationErasurePort.erase` | PUB | `DELETE /api/v1/pub/projetos/{id}/erasure` | publicações e arquivos ePub/PDF |
| 2 | `CompositionErasurePort.erase` | COMP | `DELETE /api/v1/comp/projetos/{id}/erasure` | metadados e configuração de layout |
| 3 | `ManuscriptErasurePort.erase` | IMP | `DELETE /api/v1/imp/projetos/{id}/erasure` | manuscritos, binários e imagens |
| 4 | — | PROJ | — | `projeto_editorial` (e o histórico de status, pela FK) |

- Apagar dados que já não existem é um no-op, não um erro.
- Se uma etapa falhar, a exclusão para antes de apagar o projeto e responde `502`
  (`urn:cordele:proj:erasure-failed`).

## 4. Configuração

As URLs base vêm de `IMP_SERVICE_URL`, `COMP_SERVICE_URL` e `PUB_SERVICE_URL`. Sem a variável, o serviço
usa uma implementação vazia no lugar do adapter HTTP (leituras vazias e limpeza que não faz nada) e a
leitura correspondente sai marcada como degradada. As chamadas levam o token do usuário da requisição.
