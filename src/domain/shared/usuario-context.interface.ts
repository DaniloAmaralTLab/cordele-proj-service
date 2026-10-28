/**
 * Domain-level representation of the authenticated caller.
 *
 * Pure TypeScript interface — zero @nestjs/* and zero @prisma/client imports
 * Infrastructure resolves the concrete value from the JWT;
 * the domain receives only this minimal contract so application services stay
 * portable and testable without the Nest framework.
 *
 * Populated from the JWT by the authentication guard.
 */
export interface UsuarioContext {
  /** Unique identifier of the authenticated user. */
  readonly id: string;
  /** Resolved empresa for this request — every repository call is scoped by it. */
  readonly empresaId: string;
  /** OAuth2 scopes granted to this principal (e.g. proj:read, proj:write). */
  readonly scopes: string[];
}
