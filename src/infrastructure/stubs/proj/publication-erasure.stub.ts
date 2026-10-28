/**
 * PublicationErasureStub — in-memory fallback adapter for PublicationErasurePort.
 *
 * Registered under PUBLICATION_ERASURE_PORT when PUB_SERVICE_URL is not set;
 * otherwise the real HTTP adapter (PubPublicationErasureAdapter) is used.
 *
 * Behaviour: logs WARN and resolves (no-op success) — there is no local data
 * to purge when PUB is not configured, so the cascade proceeds instead of
 * failing the whole delete.
 *
 * The real HTTP client is in infrastructure/proj/erasure/.
 */

import { Logger } from '@nestjs/common';

import type { PublicationErasurePort } from '../../../domain/proj/ports/outbound/publication-erasure.port';

export class PublicationErasureStub implements PublicationErasurePort {
  private readonly logger = new Logger(PublicationErasureStub.name);

  async erase(projetoId: string, empresaId: string, _bearerToken?: string): Promise<void> {
    this.logger.warn(
      `degraded:true port=PublicationErasurePort empresaId=${empresaId} projetoId=${projetoId}`,
    );
  }
}
