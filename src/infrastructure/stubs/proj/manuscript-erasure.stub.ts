/**
 * ManuscriptErasureStub — in-memory fallback adapter for ManuscriptErasurePort.
 *
 * Registered under MANUSCRIPT_ERASURE_PORT when IMP_SERVICE_URL is not set;
 * otherwise the real HTTP adapter (ImpManuscriptErasureAdapter) is used.
 *
 * Behaviour: logs WARN and resolves (no-op success) — mirrors
 * PublicationErasureStub so the cascade proceeds when IMP is not configured.
 *
 * The real HTTP client is in infrastructure/proj/erasure/.
 */

import { Logger } from '@nestjs/common';

import type { ManuscriptErasurePort } from '../../../domain/proj/ports/outbound/manuscript-erasure.port';

export class ManuscriptErasureStub implements ManuscriptErasurePort {
  private readonly logger = new Logger(ManuscriptErasureStub.name);

  async erase(projetoId: string, empresaId: string, _bearerToken?: string): Promise<void> {
    this.logger.warn(
      `degraded:true port=ManuscriptErasurePort empresaId=${empresaId} projetoId=${projetoId}`,
    );
  }
}
