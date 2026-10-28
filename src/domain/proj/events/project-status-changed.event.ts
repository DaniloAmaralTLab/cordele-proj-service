/**
 * Domain event emitted after a ProjetoEditorial status transition is committed.
 *
 * Pure domain type — no @nestjs/* or @prisma/client imports.
 * Emitted by AdvanceProjetoStatusUseCase and ReopenProjectForRevisionUseCase only
 * when the status actually changed (NOT emitted on idempotent no-ops).
 */
export class ProjectStatusChangedEvent {
  /** UUID v4 — unique per emission; used to detect duplicate deliveries. */
  readonly eventId: string;
  /** RFC 3339 UTC timestamp of when the event occurred. */
  readonly occurredAt: string;
  /** Identifier of the ProjetoEditorial whose status changed. */
  readonly projetoId: string;
  /** Empresa that owns the project. */
  readonly editoraId: string;
  /** Status before the transition (null only possible for creation, not status-change). */
  readonly statusDe: string;
  /** Status after the transition. */
  readonly statusPara: string;
  /** User or system actor that requested the transition. */
  readonly solicitadoPor: string;

  constructor(params: {
    eventId: string;
    occurredAt: string;
    projetoId: string;
    editoraId: string;
    statusDe: string;
    statusPara: string;
    solicitadoPor: string;
  }) {
    this.eventId = params.eventId;
    this.occurredAt = params.occurredAt;
    this.projetoId = params.projetoId;
    this.editoraId = params.editoraId;
    this.statusDe = params.statusDe;
    this.statusPara = params.statusPara;
    this.solicitadoPor = params.solicitadoPor;
  }
}
