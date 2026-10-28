# Cordelê — proj-service

Serviço de projetos do **Cordelê**, uma plataforma B2B que transforma manuscritos (DOCX / Markdown) em
ePub válidos. A plataforma tem quatro serviços NestJS:

| Serviço | Responsabilidade |
|---|---|
| imp-service  | Importa DOCX/Markdown para uma árvore de conteúdo; curadoria de trechos não reconhecidos |
| comp-service | Metadados editoriais, layout, capa, pré-visualização |
| pub-service  | Monta e valida o ePub; histórico de publicações |
| proj-service | Ciclo de vida e status do projeto editorial |

Este repositório tem só o **proj-service**. Os contratos e specs dele estão em
`docs/services/proj-service/`; os outros serviços ficam em outros repositórios.

## Estrutura

```
src/modules/          módulos Nest: controllers, DTOs, casos de uso
src/domain/           entidades, value objects, portas — sem imports de framework
src/infrastructure/   repositórios Prisma, adapters HTTP, auth
prisma/               schema e migrations
docs/                 contratos e specs do serviço
```

## Desenvolvimento (Node 22)

```bash
npm install
npm run prisma:generate
npm test              # testes unitários (Jest), não precisam de banco
npm run typecheck
npm run lint          # inclui as regras de fronteira entre camadas
```

Para subir o serviço:

```bash
cp .env.example .env
npm run prisma:migrate   # aplica as migrations no PostgreSQL do DATABASE_URL
npm run start:dev
```

Precisa de PostgreSQL 16 e de um provedor OIDC (Keycloak no ambiente local). O schema da empresa é
escolhido em tempo de execução a partir do token. As variáveis `*_SERVICE_URL` apontam para os outros
serviços; sem elas o serviço sobe com implementações vazias e as leituras saem marcadas como degradadas.

## Licença

MIT — ver [LICENSE](LICENSE).
