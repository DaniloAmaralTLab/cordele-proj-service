/**
 * PartialResultError<T> — thrown by a chunked adapter when some (but not all)
 * chunks succeed. Carries the partial result so the caller can use data from
 * successful chunks while signalling degradation.
 *
 * Lives in domain/shared/ so both modules/ (use cases) and infrastructure/
 * (adapters) can import it without depending on each other:
 *   - infrastructure/ adapters throw it after collecting successful chunks.
 *   - modules/ use cases catch it and extract the partial data.
 *
 * Pure TypeScript — zero @prisma/client and @nestjs/* imports.
 */
export class PartialResultError<T> extends Error {
  /**
   * @param partial     — data from the chunks that succeeded; never empty
   *                     (if all chunks failed a plain Error is thrown instead).
   * @param failedChunks — number of chunks that failed (1 ≤ failedChunks < totalChunks).
   * @param totalChunks  — total number of chunks dispatched.
   * @param cause        — last error seen from a failed chunk (informational).
   */
  constructor(
    public readonly partial: T,
    public readonly failedChunks: number,
    public readonly totalChunks: number,
    cause?: Error,
  ) {
    super(
      `Partial result: ${failedChunks}/${totalChunks} chunks failed`,
      cause ? { cause } : undefined,
    );
    this.name = 'PartialResultError';
  }
}
