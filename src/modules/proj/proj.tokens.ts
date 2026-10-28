/**
 * Dependency-injection token constants for the PROJ bounded context.
 *
 * All provider tokens are declared here so that proj.module.ts and any future
 * modules/ consumer can import tokens without ever touching src/infrastructure/
 * directly. The repository token re-exports the canonical Symbol from domain
 * so callers have a single import point.
 */

// --- Outbound port tokens ---

/**
 * Injection token for the ProjetoEditorialRepository outbound port.
 * Bound to the Prisma adapter by PersistenceModule.
 */
export { ProjetoEditorialRepository as PROJETO_EDITORIAL_REPOSITORY } from '../../domain/proj/projeto-editorial.repository';

// --- Empresa context token ---

/** Injection token for the EmpresaContext accessor. */
export const EMPRESA_CONTEXT_TOKEN = Symbol('EmpresaContext');

// --- Use-case tokens ---

/**
 * Injection token for the CreateProjetoUseCase inbound port.
 */
export const CREATE_PROJETO_USE_CASE = Symbol('CreateProjetoUseCase');

/**
 * Injection token for the AdvanceProjetoStatusUseCase inbound port.
 */
export const ADVANCE_PROJETO_STATUS_USE_CASE = Symbol('AdvanceProjetoStatusUseCase');

/**
 * Injection token for the ReopenProjectUseCase inbound port.
 */
export const REOPEN_PROJECT_USE_CASE = Symbol('ReopenProjectUseCase');

/**
 * Injection token for the GetProjetoLibraryUseCase inbound port.
 */
export const GET_PROJETO_LIBRARY_USE_CASE = Symbol('GetProjetoLibraryUseCase');

/**
 * Injection token for the GetProjetoDetailUseCase inbound port.
 */
export const GET_PROJETO_DETAIL_USE_CASE = Symbol('GetProjetoDetailUseCase');

/**
 * Injection token for the GetPublicationHistoryUseCase inbound port.
 */
export const GET_PUBLICATION_HISTORY_USE_CASE = Symbol('GetPublicationHistoryUseCase');

/**
 * Injection token for the GetSignedDownloadUrlUseCase inbound port.
 */
export const GET_SIGNED_DOWNLOAD_URL_USE_CASE = Symbol('GetSignedDownloadUrlUseCase');

/**
 * Injection token for the DeleteProjetoUseCase inbound port.
 */
export const DELETE_PROJETO_USE_CASE = Symbol('DeleteProjetoUseCase');

// --- Outbound read port tokens ---
// Re-exported from the domain port files so that infrastructure/ can import
// the same Symbol from domain/ without depending on modules/.

/**
 * Injection token for ManuscriptSummaryPort (IMP cross-context read).
 * Token is the Symbol exported by the domain port file (structural consistency).
 */
export { ManuscriptSummaryPort as MANUSCRIPT_SUMMARY_PORT } from '../../domain/proj/ports/outbound/manuscript-summary.port';

/**
 * Injection token for ProjectMetadataPort (COMP cross-context read).
 */
export { ProjectMetadataPort as PROJECT_METADATA_PORT } from '../../domain/proj/ports/outbound/project-metadata.port';

/**
 * Injection token for PublicationHistoryPort (PUB cross-context read).
 */
export { PublicationHistoryPort as PUBLICATION_HISTORY_PORT } from '../../domain/proj/ports/outbound/publication-history.port';

// --- Infrastructure port tokens ---

/** Injection token for the project event publisher. */
export const PROJECT_EVENT_PUBLISHER = Symbol('ProjectEventPublisher');

/**
 * Injection token for the ProjetoEditorialLookup inbound port.
 * Symbol declared in the domain port file; re-exported here so modules/ consumers
 * have a single import point without importing domain/ directly.
 * Real provider (ProjetoEditorialLookupAdapter) registered via LookupPortsModule
 * (@Global()) imported in AppModule.
 */
export { ProjetoEditorialLookupPort as PROJETO_EDITORIAL_LOOKUP } from '../../domain/proj/ports/inbound/projeto-editorial-lookup.port';

// --- Outbound erasure port tokens ---
// Re-exported from the domain port files so that infrastructure/ (the global
// ErasurePortsModule) and modules/ share the same Symbol (structural
// consistency with the read-port tokens above).

/**
 * Injection token for PublicationErasurePort (PUB LGPD purge).
 */
export { PublicationErasurePort as PUBLICATION_ERASURE_PORT } from '../../domain/proj/ports/outbound/publication-erasure.port';

/**
 * Injection token for CompositionErasurePort (COMP LGPD purge).
 */
export { CompositionErasurePort as COMPOSITION_ERASURE_PORT } from '../../domain/proj/ports/outbound/composition-erasure.port';

/**
 * Injection token for ManuscriptErasurePort (IMP LGPD purge).
 */
export { ManuscriptErasurePort as MANUSCRIPT_ERASURE_PORT } from '../../domain/proj/ports/outbound/manuscript-erasure.port';
