import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { EmpresaContextMiddleware } from './middleware/empresa-context.middleware';
import { ProjController } from './proj.controller';
import {
  ADVANCE_PROJETO_STATUS_USE_CASE,
  CREATE_PROJETO_USE_CASE,
  DELETE_PROJETO_USE_CASE,
  GET_PROJETO_DETAIL_USE_CASE,
  GET_PROJETO_LIBRARY_USE_CASE,
  GET_PUBLICATION_HISTORY_USE_CASE,
  GET_SIGNED_DOWNLOAD_URL_USE_CASE,
  PROJECT_EVENT_PUBLISHER,
  REOPEN_PROJECT_USE_CASE,
} from './proj.tokens';

// Write-side use cases
import { CreateProjetoEditorialUseCase } from './use-cases/create-projeto-editorial.use-case';
import { AdvanceProjetoStatusUseCase } from './use-cases/advance-projeto-status.use-case';
import { ReopenProjectForRevisionUseCase } from './use-cases/reopen-project-for-revision.use-case';

// Read-side use cases
import { GetProjetoLibraryUseCase } from './use-cases/get-projeto-library.use-case';
import { GetProjetoDetailUseCase } from './use-cases/get-projeto-detail.use-case';
import { GetPublicationHistoryUseCase } from './use-cases/get-publication-history.use-case';
import { GetSignedDownloadUrlUseCase } from './use-cases/get-signed-download-url.use-case';

// LGPD erasure use case
import { DeleteProjetoUseCase } from './use-cases/delete-projeto.use-case';

/**
 * PROJ — Projetos Editoriais bounded context module.
 *
 * Use cases are registered with useClass so Nest's DI resolves their
 * injected port dependencies.
 *
 * Read port tokens (MANUSCRIPT_SUMMARY_PORT, PROJECT_METADATA_PORT,
 * PUBLICATION_HISTORY_PORT) are provided globally by ReadPortsModule
 * (@Global()) imported in AppModule. ProjModule never imports
 * infrastructure/ directly.
 *
 * PROJETO_EDITORIAL_REPOSITORY is provided globally by PersistenceModule
 * (@Global()) in the same way.
 */
@Module({
  controllers: [ProjController],
  providers: [
    // NOTE: PROJETO_EDITORIAL_REPOSITORY is provided globally by
    // PersistenceModule, which AppModule imports as @Global().

    // --- Event publisher (no-op) ---
    {
      provide: PROJECT_EVENT_PUBLISHER,
      useValue: { publish: () => undefined },
    },

    // --- Write-side use cases ---

    /**
     * CreateProjetoEditorialUseCase
     * Also satisfies CreateProjetoEditorialPort for IMP.
     */
    {
      provide: CREATE_PROJETO_USE_CASE,
      useClass: CreateProjetoEditorialUseCase,
    },

    /**
     * AdvanceProjetoStatusUseCase
     * Called by IMP (confirm-estrutura) and PUB (export result).
     */
    {
      provide: ADVANCE_PROJETO_STATUS_USE_CASE,
      useClass: AdvanceProjetoStatusUseCase,
    },

    /**
     * ReopenProjectForRevisionUseCase
     * The one deliberate backward edge; editor-only.
     */
    {
      provide: REOPEN_PROJECT_USE_CASE,
      useClass: ReopenProjectForRevisionUseCase,
    },

    // NOTE: PROJETO_EDITORIAL_LOOKUP is provided globally by LookupPortsModule
    // (@Global()) imported in AppModule. The adapter
    // (ProjetoEditorialLookupAdapter) reads empresaId from EmpresaContextStore
    // (AsyncLocalStorage populated by JwtAuthGuard) and delegates to the
    // ProjetoEditorialRepository for cross-tenant safety.
    // ProjModule never imports infrastructure/ directly.

    // NOTE: MANUSCRIPT_SUMMARY_PORT, PROJECT_METADATA_PORT, PUBLICATION_HISTORY_PORT
    // are provided globally by ReadPortsModule (@Global()) imported in AppModule.
    // ProjModule never references them here.

    // --- Read-side use cases ---

    /**
     * GetProjetoLibraryUseCase
     * Batches 3 port calls; degrades gracefully when any port throws.
     */
    {
      provide: GET_PROJETO_LIBRARY_USE_CASE,
      useClass: GetProjetoLibraryUseCase,
    },

    /**
     * GetProjetoDetailUseCase
     * Composes cross-context fields for one project.
     */
    {
      provide: GET_PROJETO_DETAIL_USE_CASE,
      useClass: GetProjetoDetailUseCase,
    },

    /**
     * GetPublicationHistoryUseCase
     * Returns publication list ordered newest-first.
     */
    {
      provide: GET_PUBLICATION_HISTORY_USE_CASE,
      useClass: GetPublicationHistoryUseCase,
    },

    /**
     * GetSignedDownloadUrlUseCase
     * Returns 409 for erros_criticos/pendente; mints URL for valido/avisos.
     */
    {
      provide: GET_SIGNED_DOWNLOAD_URL_USE_CASE,
      useClass: GetSignedDownloadUrlUseCase,
    },

    /**
     * DeleteProjetoUseCase
     * Orchestrates the leaf-first LGPD erasure cascade (PUB -> COMP -> IMP ->
     * DB delete). PUBLICATION_ERASURE_PORT, COMPOSITION_ERASURE_PORT and
     * MANUSCRIPT_ERASURE_PORT are provided globally by ErasurePortsModule
     * (@Global()) imported in AppModule — same pattern as the read ports.
     */
    {
      provide: DELETE_PROJETO_USE_CASE,
      useClass: DeleteProjetoUseCase,
    },
  ],
  exports: [
    // 3 inbound ports exported for IMP / PUB / editor callers
    // NOTE: PROJETO_EDITORIAL_LOOKUP is provided globally by LookupPortsModule (@Global())
    // and is automatically available to all modules — no re-export needed here.
    CREATE_PROJETO_USE_CASE,
    ADVANCE_PROJETO_STATUS_USE_CASE,
    REOPEN_PROJECT_USE_CASE,
  ],
})
export class ProjModule implements NestModule {
  /**
   * Apply EmpresaContext middleware to all routes handled by this module.
   *
   * The middleware is a passthrough. `empresaId` is resolved from the JWT
   * claim via `@CurrentUser()` in `ProjController` and passed explicitly into
   * every use case call instead of populating an AsyncLocalStorage store
   * here — Express middleware runs before
   * `JwtAuthGuard`, so `req.user` is not yet available at this stage.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(EmpresaContextMiddleware).forRoutes(ProjController);
  }
}
