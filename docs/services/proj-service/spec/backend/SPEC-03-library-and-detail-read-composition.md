# Biblioteca e detalhe do projeto

A biblioteca de projetos e a tela de detalhe/histórico juntam os dados do próprio PROJ (identidade e
status) com leituras feitas no IMP, no COMP e no PUB. Os endpoints e schemas estão no contrato da API
(seções 4.2 a 4.4 e 6); as portas e endpoints dos outros serviços estão nas integrações.

## Regras

- **Sem N+1.** Na biblioteca, cada serviço é consultado em lote com todos os `projetoId` da página
  (`summaries`, `latest`, `metadata`), nunca uma vez por card. O número de chamadas não cresce com o
  número de projetos.
- **Degradar, nunca falhar.** Se um serviço não responder, os campos que viriam dele ficam nulos (ou 0,
  no caso das contagens), a resposta sai com `degraded = true` (na biblioteca, header `X-Degraded: true`)
  e o status do projeto continua aparecendo. Um serviço fora do ar nunca derruba a leitura.

## Composição

Card da biblioteca: `id`, `nome`, `autor` (COMP), `status`, `totalCapitulos` e `totalImagens` (último
manuscrito no IMP), `ultimoEpubcheckStatus` (última publicação no PUB), `ultimaAtividadeEm` e `criadoEm`.

Detalhe: identidade, status, `manuscriptSummary` (IMP), `metadata.autor` (COMP) e `publicationHistory`
(PUB).

Histórico: lista de publicações do PUB, ordenada por `criadoEm` decrescente.

`ultimaAtividadeEm` é o maior valor entre `projeto_editorial.atualizado_em` e o `criadoEm` da última
publicação.

## Casos de borda

- Projeto sem manuscrito: contagens 0 e `manuscriptSummary = null`.
- Projeto sem metadados no COMP: `autor = null`.
- Projeto nunca exportado: `ultimoEpubcheckStatus = null` e `publicationHistory = []`.
- PUB fora do ar: histórico vazio, `ultimoEpubcheckStatus = null`, `degraded = true`; o status continua.

## Critérios de aceite

- A biblioteca devolve os cards ordenados por `ultimaAtividadeEm` decrescente, com contagens, último
  epubcheck e autor.
- A biblioteca faz um número fixo de chamadas a outros serviços por página, independente de quantos
  projetos há nela.
- Projeto sem manuscrito aparece com `totalCapitulos = 0` e `totalImagens = 0`.
- O detalhe traz status, resumo do manuscrito, metadados e histórico.
- Com um serviço indisponível, a leitura ainda responde, com os campos dele nulos e `degraded = true`.
- O histórico vem ordenado por `criadoEm` decrescente.
