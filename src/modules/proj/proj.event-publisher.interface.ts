/**
 * Minimal event-publishing port for the PROJ bounded context.
 *
 * Decouples use cases from the concrete EventEmitter2 implementation so that
 * unit tests can inject a jest.fn() mock and verify publish calls without
 * needing @nestjs/event-emitter to be configured.
 *
 * The binding is provided in proj.module.ts.
 */
export interface IProjectEventPublisher {
  /**
   * Publishes a domain event by name.
   *
   * The event is fire-and-forget: listeners run asynchronously outside the
   * originating transaction (api-contract §7).
   *
   * @param eventName  - discriminator used by listeners (e.g. 'ProjectCreated')
   * @param payload    - the domain event object
   */
  publish(eventName: string, payload: unknown): void;
}
