import { Global, Module } from '@nestjs/common';

// Domain tokens (infrastructure may import domain; only modules/ is off limits)
import { ProjetoEditorialRepository } from '../../domain/proj/projeto-editorial.repository';

import { DatabaseModule } from './database.module';
import { TenantPrismaFactory } from './tenant-prisma.factory';
import { PrismaProjetoEditorialRepository } from './proj/projeto-editorial.repository';

/**
 * Global persistence module for proj-service.
 *
 * Decorated with @Global() so ProjModule and any future feature module can
 * inject the repository tokens without importing this module directly
 * (modules/ must not import infrastructure/ directly;
 *  infrastructure/ must not import modules/).
 *
 * Token resolution:
 *   ProjetoEditorialRepository (Symbol)  → PrismaProjetoEditorialRepository
 *
 * ProjModule does not declare these providers — it inherits them from global scope.
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    TenantPrismaFactory,

    // ProjetoEditorial aggregate persistence
    PrismaProjetoEditorialRepository,
    {
      provide: ProjetoEditorialRepository,
      useClass: PrismaProjetoEditorialRepository,
    },
  ],
  exports: [
    DatabaseModule,
    TenantPrismaFactory,
    ProjetoEditorialRepository,
  ],
})
export class PersistenceModule {}
