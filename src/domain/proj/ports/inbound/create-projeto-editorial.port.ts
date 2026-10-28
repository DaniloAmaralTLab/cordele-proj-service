/**
 * Inbound port for creating a ProjetoEditorial.
 *
 * Published as a DI provider under `CREATE_PROJETO_USE_CASE` so IMP can inject
 * it without coupling to the use-case implementation class.
 *
 * Pure domain interface — zero @nestjs/* and zero @prisma/client imports.
 *
 * integration-contracts §1.1:
 *   Caller: IMP (create-and-upload flow)
 *   Input:  { titulo: string }
 *   Output: { projetoId: string }
 */
export interface CreateProjetoEditorialPort {
  /**
   * Creates a new ProjetoEditorial in status `rascunho` from the IMP flow.
   *
   * @param input - `titulo` maps to `projeto_editorial.nome`
   * @returns resolved projetoId; editoraId comes from EmpresaContext (AsyncLocalStorage)
   */
  create(input: { titulo: string }): Promise<{ projetoId: string }>;
}
