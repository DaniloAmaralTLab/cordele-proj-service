# Exclusão de projeto e apagamento de dados (LGPD)

O projeto é a identidade a que manuscritos (IMP), metadados e layout (COMP) e publicações (PUB) estão
ligados. Excluir um projeto tem de apagar tudo isso, inclusive os arquivos no storage, que não estão no
banco. O PROJ é o ponto de entrada; cada serviço apaga os seus próprios dados.

## Ordem

A limpeza vai das folhas para a raiz, para que uma falha no meio deixe o projeto ainda existente e a
exclusão possa ser repetida, em vez de deixar dados órfãos sem dono:

1. PUB: publicações e arquivos ePub/PDF.
2. COMP: metadados e configuração de layout.
3. IMP: manuscritos, binários e imagens.
4. PROJ: `projeto_editorial` (o histórico de status vai junto pela FK).
5. Depois do commit, emitir `ProjectDeleted`.

As FKs com `ON DELETE CASCADE` dos outros serviços são só uma rede de segurança para registros; elas não
apagam arquivos. Quem garante o storage é essa sequência.

## Regras

- **Apagar o que não existe é no-op.** Se um serviço não tem dados do projeto (ou já apagou), a etapa
  conta como concluída, não como erro. É isso que permite repetir uma exclusão que falhou no meio.
- **Falha aborta.** Se uma etapa falhar de verdade (serviço fora do ar, erro do servidor), a exclusão para
  antes do passo 4, o projeto continua existindo e a resposta é `502` (`urn:cordele:proj:erasure-failed`).
- Tudo roda na empresa de quem chamou.

## Casos de borda

- Projeto sem manuscrito nem publicação: as etapas são no-op e o projeto é apagado.
- PUB fora do ar no passo 1: `502`, projeto intacto, pode tentar de novo.
- COMP já apagado e IMP falhou: `502`; na nova tentativa PUB e COMP são no-op e o IMP completa.
- Duas exclusões simultâneas: a segunda recebe `404` depois que a primeira termina.

## Critérios de aceite

- A exclusão chama PUB, depois COMP, depois IMP, apaga o projeto e emite `ProjectDeleted`.
- Uma etapa sobre dados já ausentes conclui sem erro.
- Se qualquer etapa falhar, o projeto não é apagado e a resposta é `502`.
- Os arquivos do manuscrito e das publicações são removidos pelos serviços donos, não pela FK.
- A sequência inteira roda na empresa de quem chamou.
