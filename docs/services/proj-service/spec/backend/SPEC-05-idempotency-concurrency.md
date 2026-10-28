# Idempotência e concorrência

Não há broker, então não há reentrega de mensagens. Mas IMP, PUB e o editor podem repetir chamadas
(timeout, clique duplo, retry) e podem chamar ao mesmo tempo sobre o mesmo projeto. Este documento diz o
que tem de valer nesses casos.

## Regras

- **Transições idempotentes.** `advanceTo` e `reopen` só gravam histórico e emitem `ProjectStatusChanged`
  quando o status muda de fato (ver o documento de ciclo de vida, passos 3 e 4). Repetir uma chamada não
  duplica evento nem faz o status voltar.
- **Exclusão idempotente.** Cada etapa de limpeza nos outros serviços é um no-op quando os dados já não
  existem, então um `DELETE` repetido depois de uma falha parcial termina normalmente.
- **Concorrência.** Ler o status, validar a transição e gravar acontecem como uma operação só, com a
  linha do projeto travada. Duas chamadas simultâneas sobre o mesmo projeto ficam em fila: a segunda
  reavalia a tabela contra o status que a primeira já gravou. Leituras (biblioteca, detalhe) não travam
  nada.
- **Atomicidade.** A mudança de status e a linha do histórico são gravadas na mesma transação; o evento
  sai depois do commit.
- Todo evento tem um `eventId` único.

## Casos de borda

- O PUB chama `advanceTo(publicado)` duas vezes: a primeira aplica, a segunda é no-op.
- O IMP confirma a estrutura de novo num projeto em `em_composicao` ou `publicado`: no-op, o status não
  volta.
- `DELETE` repetido depois de uma limpeza parcial: completa e apaga o projeto.
- Dois `reopen` simultâneos no mesmo projeto `publicado`: um aplica (`changed = true`, um evento) e o
  outro vira no-op (`changed = false`, sem evento).
- PUB `advanceTo(publicado)` e editor `reopen` ao mesmo tempo: são serializados, e o segundo é avaliado
  contra o status deixado pelo primeiro.

## Critérios de aceite

- `ProjectStatusChanged` só sai quando o status muda; chamadas repetidas não duplicam o evento.
- `advanceTo` para um status já alcançado devolve `changed = false` sem efeito colateral.
- Mudança de status e histórico são gravados juntos, ou nenhum dos dois.
- Duas transições simultâneas no mesmo projeto não produzem duas mudanças a partir do mesmo status
  inicial; a segunda vê o status já gravado.
- Um `DELETE` repetido depois de falha parcial termina e apaga o projeto.
- Cada evento publicado tem um `eventId` único.
