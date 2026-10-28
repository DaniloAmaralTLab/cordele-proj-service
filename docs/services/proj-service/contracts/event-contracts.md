# Eventos — proj-service

Não há broker. Os eventos são notificações dentro do próprio processo, disparadas depois do commit, para
logs, auditoria e leituras derivadas. Nenhum evento é usado para mudar o status de um projeto: isso só
acontece pelo `advanceTo` e pelo `reopen`.

O contexto da requisição (`correlationId`, empresa, usuário) não vai no payload; ele acompanha a
requisição.

## ProjectCreated

Disparado depois que um projeto novo é gravado em `rascunho`, inclusive quando a criação vem do IMP.

```json
{
  "eventId": "uuid",
  "occurredAt": "2026-08-25T14:00:00Z",
  "projetoId": "uuid",
  "editoraId": "uuid",
  "nome": "Romance das Cidades",
  "status": "rascunho"
}
```

- Exatamente um evento por projeto criado.
- Se a transação for desfeita, o evento não sai.

## ProjectStatusChanged

Disparado só quando o status muda de fato, depois que o novo status e a linha do histórico foram gravados.
Um no-op (status igual, ou `advanceTo(em_composicao)` num projeto que já passou da composição) não gera
evento.

```json
{
  "eventId": "uuid",
  "occurredAt": "2026-08-25T14:31:46Z",
  "projetoId": "uuid",
  "editoraId": "uuid",
  "statusDe": "em_composicao",
  "statusPara": "publicado",
  "solicitadoPor": "pub"
}
```

- `solicitadoPor` é quem pediu a mudança: `imp`, `pub`, `comp`, `editor` ou `system`.
- `statusPara` é sempre igual ao status gravado em `projeto_editorial`.

## ProjectDeleted

Disparado depois que a limpeza nos outros serviços terminou e o projeto foi apagado. Serve para auditoria.

```json
{
  "eventId": "uuid",
  "occurredAt": "2026-08-25T15:00:00Z",
  "projetoId": "uuid",
  "editoraId": "uuid"
}
```

- Se a exclusão abortar antes de apagar o projeto, o evento não sai.

## Eventos consumidos

Nenhum. O IMP e o PUB avançam o status chamando o PROJ diretamente, não publicando eventos.

## Idempotência e versão

- Cada evento tem um `eventId` único. Se algum dia houver um consumidor fora do processo, é essa a chave
  para descartar duplicados.
- Retentativas de `advanceTo`/`reopen` não duplicam evento, porque o evento só sai quando o status muda.
- Os payloads só evoluem com campos novos opcionais. Mudança incompatível vira um evento com outro nome.
  Consumidores devem ignorar campos que não conhecem.
