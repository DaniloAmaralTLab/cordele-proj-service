/**
 * ErasurePortsModule — global provider module for the three outbound erasure
 * ports (PublicationErasurePort, CompositionErasurePort, ManuscriptErasurePort)
 * used by the LGPD delete cascade.
 *
 * Follows the same @Global() pattern as ReadPortsModule: each port resolves
 * to its real HTTP adapter when the sibling service URL is configured
 * (PUB_SERVICE_URL / COMP_SERVICE_URL / IMP_SERVICE_URL), and falls back to
 * the in-memory stub otherwise (local/dev/test without the sibling service
 * running).
 *
 * Tokens come from domain/, so modules/ never imports infrastructure/ and
 * infrastructure/ never imports modules/.
 */

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Tokens imported from DOMAIN port files (infrastructure → domain is permitted)
import { PublicationErasurePort } from '../../domain/proj/ports/outbound/publication-erasure.port';
import { CompositionErasurePort } from '../../domain/proj/ports/outbound/composition-erasure.port';
import { ManuscriptErasurePort } from '../../domain/proj/ports/outbound/manuscript-erasure.port';

import { PublicationErasureStub } from '../stubs/proj/publication-erasure.stub';
import { CompositionErasureStub } from '../stubs/proj/composition-erasure.stub';
import { ManuscriptErasureStub } from '../stubs/proj/manuscript-erasure.stub';

import { PubPublicationErasureAdapter } from './erasure/pub-publication-erasure.adapter';
import { CompCompositionErasureAdapter } from './erasure/comp-composition-erasure.adapter';
import { ImpManuscriptErasureAdapter } from './erasure/imp-manuscript-erasure.adapter';

@Global()
@Module({
  providers: [
    PubPublicationErasureAdapter,
    PublicationErasureStub,
    CompCompositionErasureAdapter,
    CompositionErasureStub,
    ImpManuscriptErasureAdapter,
    ManuscriptErasureStub,

    /**
     * PublicationErasurePort → PubPublicationErasureAdapter when
     * PUB_SERVICE_URL is configured; PublicationErasureStub otherwise.
     */
    {
      provide: PublicationErasurePort,
      useFactory: (
        config: ConfigService,
        real: PubPublicationErasureAdapter,
        stub: PublicationErasureStub,
      ) => (config.get<string>('PUB_SERVICE_URL') ? real : stub),
      inject: [ConfigService, PubPublicationErasureAdapter, PublicationErasureStub],
    },

    /**
     * CompositionErasurePort → CompCompositionErasureAdapter when
     * COMP_SERVICE_URL is configured; CompositionErasureStub otherwise.
     */
    {
      provide: CompositionErasurePort,
      useFactory: (
        config: ConfigService,
        real: CompCompositionErasureAdapter,
        stub: CompositionErasureStub,
      ) => (config.get<string>('COMP_SERVICE_URL') ? real : stub),
      inject: [ConfigService, CompCompositionErasureAdapter, CompositionErasureStub],
    },

    /**
     * ManuscriptErasurePort → ImpManuscriptErasureAdapter when
     * IMP_SERVICE_URL is configured; ManuscriptErasureStub otherwise.
     */
    {
      provide: ManuscriptErasurePort,
      useFactory: (
        config: ConfigService,
        real: ImpManuscriptErasureAdapter,
        stub: ManuscriptErasureStub,
      ) => (config.get<string>('IMP_SERVICE_URL') ? real : stub),
      inject: [ConfigService, ImpManuscriptErasureAdapter, ManuscriptErasureStub],
    },
  ],
  exports: [
    PublicationErasurePort,
    CompositionErasurePort,
    ManuscriptErasurePort,
  ],
})
export class ErasurePortsModule {}
