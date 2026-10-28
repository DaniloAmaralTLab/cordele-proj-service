# Observabilidade e health check

## Health

- `GET /health/live` responde enquanto o processo está de pé.
- `GET /health` (readiness) depende só do banco: banco fora do ar dá `503`.
- IMP, COMP e PUB não entram no readiness. Se um deles cair, as respostas que dependem dele saem
  degradadas, mas o PROJ continua pronto.

## Correlação e logs

- `X-Correlation-Id` é lido da requisição (ou gerado), vai para todos os logs e volta sempre na resposta.
- Cada transição de status aplicada gera um log com `projetoId`, `statusDe`, `statusPara`,
  `solicitadoPor` e `correlationId`.
- Cada exclusão gera log de cada etapa (pub, comp, imp) e do resultado final (concluída ou abortada).

## Degradar, nunca falhar

Um serviço externo fora do ar ou que não responde nunca pode derrubar a biblioteca ou o detalhe. A
resposta sai com os campos daquele serviço nulos e `degraded = true` (na biblioteca, também o header
`X-Degraded: true`), e a falha é registrada em log; nunca é engolida em silêncio. Na exclusão a regra é
outra: se uma etapa de limpeza falhar, a exclusão aborta com `502` (ver o documento de exclusão).

## Casos de borda

- Banco fora do ar: readiness `503`; liveness continua respondendo.
- PUB, IMP ou COMP fora do ar: resposta com `degraded = true`; readiness continua OK.

## Critérios de aceite

- Liveness e readiness existem; readiness reflete só o banco.
- Toda resposta devolve `X-Correlation-Id`, e ele aparece nos logs da requisição.
- Toda transição aplicada é registrada com `statusDe`, `statusPara`, `solicitadoPor` e `correlationId`.
- Com um serviço externo indisponível, a resposta sai com `degraded = true` e a falha aparece no log.
- Toda exclusão registra cada etapa e o resultado final.
