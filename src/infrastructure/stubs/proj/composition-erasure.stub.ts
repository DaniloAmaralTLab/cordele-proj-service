/**
 * CompositionErasureStub — in-memory fallback adapter for CompositionErasurePort.
 *
 * Registered under COMPOSITION_ERASURE_PORT when COMP_SERVICE_URL is not set;
 * otherwise the real HTTP adapter (CompCompositionErasureAdapter) is used.
 *
 * Behaviour: logs WARN and resolves (no-op success) — mirrors
 * PublicationErasureStub so the cascade proceeds when COMP is not configured.
 *
 * The real HTTP client is in infrastructure/proj/erasure/.
 */

import { Logger } from '@nestjs/common';

import type { CompositionErasurePort } from '../../../domain/proj/ports/outbound/composition-erasure.port';

export class CompositionErasureStub implements CompositionErasurePort {
  private readonly logger = new Logger(CompositionErasureStub.name);

  async erase(projetoId: string, empresaId: string, _bearerToken?: string): Promise<void> {
    this.logger.warn(
      `degraded:true port=CompositionErasurePort empresaId=${empresaId} projetoId=${projetoId}`,
    );
  }
}
