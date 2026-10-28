# Ciclo de vida e status do projeto

O PROJ é o único serviço que escreve o status de um projeto. IMP e PUB pedem mudanças pelo `advanceTo`;
o editor reabre um projeto pelo `reopen`. As regras de transição ficam no value object de status
(`ProjectStatus`), que é domínio puro; controller e adapters não repetem essas regras. A tabela completa
está na seção 7 do contrato da API.

O ponto central é a separação entre os dois caminhos: `advanceTo` só avança e é idempotente, porque é
chamado automaticamente por IMP e PUB e pode ser repetido; `reopen` é a única forma de voltar
(`publicado` ou `com_erros` para `em_composicao`), e é uma ação explícita do editor.

## advanceTo({ projetoId, targetStatus })

1. Carregar o projeto na empresa de quem chamou. Se não existir, erro de não encontrado.
2. Ler o status atual.
3. Se o status pedido for igual ao atual: nada muda (`changed = false`) e nenhum evento sai.
4. Se o status pedido for `em_composicao` e o atual for `publicado` ou `com_erros`: nada muda
   (`changed = false`) e nenhum evento sai. Não é erro; o status simplesmente não volta.
5. Se a transição estiver na tabela: aplicar, gravar, registrar no histórico (de, para, quem pediu) e
   emitir `ProjectStatusChanged` (`changed = true`).
6. Caso contrário: lançar `IllegalStatusTransitionError`.

Transições válidas pelo `advanceTo`: `rascunho → em_composicao`, `em_composicao → publicado`,
`em_composicao → com_erros`, `publicado → com_erros` e `com_erros → publicado`.

O histórico e o evento registram quem pediu a mudança (`solicitadoPor`), informado por quem chama.

## reopen(projetoId)

`publicado` ou `com_erros` passam a `em_composicao`, com histórico e evento. Se já estiver em
`em_composicao`, nada muda. A partir de `rascunho`, é rejeitado.

## Casos de borda

- O IMP confirma a estrutura de novo num projeto que já está `publicado`: nada muda, sem erro.
- O PUB exporta de novo: `com_erros → publicado` e `publicado → com_erros` são mudanças reais e emitem
  evento.
- `rascunho → publicado` (pular a composição): `IllegalStatusTransitionError`, `409` no REST.
- `targetStatus` desconhecido: `400` com `urn:cordele:proj:validation`.
- Qualquer transição para `rascunho` é ilegal; é só o estado inicial.

## Critérios de aceite

- Uma transição válida para um status diferente do atual grava a mudança, registra o histórico, emite
  `ProjectStatusChanged` e devolve `changed = true`.
- Pedir o status atual devolve `changed = false` e não emite evento.
- `advanceTo(em_composicao)` com o projeto em `publicado` ou `com_erros` devolve `changed = false`, não
  emite evento e não muda o status.
- `advanceTo(publicado)` ou `advanceTo(com_erros)` com o projeto em `rascunho` lança
  `IllegalStatusTransitionError`.
- `reopen` em `publicado` ou `com_erros` leva a `em_composicao` e emite evento; em `rascunho`, é rejeitado.
- Nenhum outro caminho escreve `projeto_editorial.status`.
