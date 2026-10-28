/**
 * Outbound port: ProjectMetadataPort
 *
 * Queries the COMP context for editorial metadata (author, layout, etc.) for
 * a batch of projects. Called once per library/detail request with ALL projetoIds
 * to enforce the batching invariant (no N+1 port calls).
 *
 * Zero @prisma/client and @nestjs/* imports. The HTTP adapter lives in
 * src/infrastructure/proj/read/.
 */

/** Composition metadata for one project (sourced from COMP). */
export interface ProjectMetadata {
  /**
   * Author name as composed by COMP.
   * Undefined when COMP has not yet produced metadata for the project.
   */
  readonly autor?: string | null;
}

/**
 * Port interface for batch-reading project metadata from COMP.
 *
 * Implementations:
 *  - In-memory stub: src/infrastructure/stubs/proj/project-metadata.stub.ts
 *  - HTTP adapter: src/infrastructure/proj/read/project-metadata.adapter.ts
 */
export interface ProjectMetadataPort {
  /**
   * Returns a Map keyed by projetoId with the metadata for each project.
   * Projects without COMP metadata are absent from the Map (not an error).
   * Called ONCE per request with all projetoIds.
   *
   * @param projetoIds - list of project UUIDs to query
   * @param empresaId  - active tenant
   */
  metadata(
    projetoIds: string[],
    empresaId: string,
    bearerToken?: string,
  ): Promise<Map<string, ProjectMetadata>>;
}

/** DI injection token for ProjectMetadataPort. Re-exported by proj.tokens.ts */
export const ProjectMetadataPort = Symbol('ProjectMetadataPort');
