/**
 * ProjectMetadataStub — in-memory fallback adapter for ProjectMetadataPort.
 *
 * Registered under PROJECT_METADATA_PORT when COMP_SERVICE_URL is not set;
 * otherwise the real HTTP adapter (CompProjectMetadataAdapter) is used.
 *
 * Behaviour:
 *   - Returns a Map with `{ autor: null }` for each projetoId so that
 *     the library and detail views render without a COMP service dependency.
 *   - Logs WARN on every call to signal degraded-mode operation.
 *   - Empty input returns empty Map.
 *
 * The real HTTP client is in infrastructure/proj/read/.
 */

import { Logger } from '@nestjs/common';

import type {
  ProjectMetadata,
  ProjectMetadataPort,
} from '../../../domain/proj/ports/outbound/project-metadata.port';

export class ProjectMetadataStub implements ProjectMetadataPort {
  private readonly logger = new Logger(ProjectMetadataStub.name);

  async metadata(
    projetoIds: string[],
    empresaId: string,
    _bearerToken?: string,
  ): Promise<Map<string, ProjectMetadata>> {
    if (projetoIds.length === 0) {
      return new Map();
    }
    this.logger.warn(
      `degraded:true port=ProjectMetadataPort empresaId=${empresaId} ids=${projetoIds.length}`,
    );
    // Provide coherent defaults: projects without COMP metadata show null autor.
    const result = new Map<string, ProjectMetadata>();
    for (const id of projetoIds) {
      result.set(id, { autor: null });
    }
    return result;
  }
}
