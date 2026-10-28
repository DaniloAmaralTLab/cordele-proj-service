/**
 * LookupPortsModule — global provider module for the inbound lookup port
 * (ProjetoEditorialLookupPort / PROJETO_EDITORIAL_LOOKUP).
 *
 * Follows the same @Global() pattern as ReadPortsModule and ErasurePortsModule:
 * the provider is registered here and injected anywhere without feature modules
 * importing infrastructure/ directly.
 *
 * Token is the Symbol exported by the domain port file
 * (`ProjetoEditorialLookupPort`), re-exported in proj.tokens.ts as
 * `PROJETO_EDITORIAL_LOOKUP` for use by modules/ consumers.
 *
 * `ProjetoEditorialRepository` is provided globally by PersistenceModule
 * (@Global()), so the adapter's constructor dependency resolves without
 * this module importing PersistenceModule directly.
 */

import { Global, Module } from '@nestjs/common';

import { ProjetoEditorialLookupPort } from '../../domain/proj/ports/inbound/projeto-editorial-lookup.port';
import { ProjetoEditorialLookupAdapter } from './lookup/projeto-editorial-lookup.adapter';

@Global()
@Module({
  providers: [
    ProjetoEditorialLookupAdapter,
    {
      provide: ProjetoEditorialLookupPort,
      useClass: ProjetoEditorialLookupAdapter,
    },
  ],
  exports: [ProjetoEditorialLookupPort],
})
export class LookupPortsModule {}
