import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response envelope for a single editorial project — full detail view.
 *
 * Aligned with api-contract.md §6.1 (ProjetoDetail). Cross-context fields
 * (manuscriptSummary, metadata, publicationHistory) are resolved from the
 * outbound read ports.
 *
 * Controllers MUST return this DTO (never a Prisma model) at the HTTP boundary.
 */
export class ProjetoDetailDto {
  @ApiProperty({ description: 'Unique project identifier (UUID v4).', format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ description: 'Owning empresa identifier (UUID v4).', format: 'uuid' })
  readonly editoraId!: string;

  @ApiProperty({ description: 'Title of the editorial project.', maxLength: 200 })
  readonly nome!: string;

  @ApiPropertyOptional({ description: 'Optional description.', nullable: true })
  readonly descricao?: string | null;

  @ApiProperty({
    description: 'Lifecycle status of the project.',
    example: 'rascunho',
    enum: ['rascunho', 'em_composicao', 'publicado', 'com_erros'],
  })
  readonly status!: string;

  @ApiProperty({ description: 'ISO-8601 UTC creation timestamp.', format: 'date-time' })
  readonly criadoEm!: string;

  @ApiProperty({ description: 'ISO-8601 UTC last-update timestamp.', format: 'date-time' })
  readonly atualizadoEm!: string;

  /**
   * Manuscript summary from IMP (ManuscriptSummaryPort).
   * Null while the project has no imported manuscript (rascunho state).
   */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Manuscript summary from IMP. Null when no manuscript imported.',
  })
  readonly manuscriptSummary?: unknown | null;

  /**
   * Project metadata from COMP (ProjectMetadataPort): autor, layout, etc.
   * Null until COMP has composed metadata.
   */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Composition metadata from COMP. Null until metadata exists.',
  })
  readonly metadata?: unknown | null;

  /**
   * Publication history from PUB (PublicationHistoryPort).
   * Empty array when the project has never been exported.
   */
  @ApiPropertyOptional({
    nullable: true,
    isArray: true,
    description: 'Publication history from PUB. Null or empty when no publications.',
  })
  readonly publicationHistory?: unknown[] | null;

  /**
   * True when one or more cross-context read ports were unavailable.
   * Clients should degrade the corresponding card fields gracefully.
   */
  @ApiPropertyOptional({ default: false })
  readonly degraded?: boolean;
}
