/**
 * ManuscriptSummaryStub — in-memory fallback adapter for ManuscriptSummaryPort.
 *
 * Registered under MANUSCRIPT_SUMMARY_PORT when IMP_SERVICE_URL is not set;
 * otherwise the real HTTP adapter (ImpManuscriptSummaryAdapter) is used.
 *
 * Behaviour:
 *   - Returns a Map with a default zero-count entry for each projetoId so that
 *     the library renders cleanly without an IMP service dependency.
 *   - Logs WARN on every call to signal degraded-mode operation.
 *   - Empty input returns empty Map (safe for zero-project requests).
 *
 * The real HTTP client is in infrastructure/proj/read/.
 */

import { Logger } from '@nestjs/common';

import type {
  ManuscriptSummary,
  ManuscriptSummaryPort,
} from '../../../domain/proj/ports/outbound/manuscript-summary.port';

export class ManuscriptSummaryStub implements ManuscriptSummaryPort {
  private readonly logger = new Logger(ManuscriptSummaryStub.name);

  async summaries(
    projetoIds: string[],
    empresaId: string,
    _bearerToken?: string,
  ): Promise<Map<string, ManuscriptSummary>> {
    if (projetoIds.length === 0) {
      return new Map();
    }
    this.logger.warn(
      `degraded:true port=ManuscriptSummaryPort empresaId=${empresaId} ids=${projetoIds.length}`,
    );
    // Provide coherent defaults: projects without an IMP manuscript show zeros.
    const result = new Map<string, ManuscriptSummary>();
    for (const id of projetoIds) {
      result.set(id, { totalCapitulos: 0, totalImagens: 0 });
    }
    return result;
  }
}
