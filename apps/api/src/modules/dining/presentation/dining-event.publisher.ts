import { DiningDomainEvent, DiningDomainEventPublisher } from '../application/contracts/domain-event.publisher';

export class LoggingDiningEventPublisher implements DiningDomainEventPublisher {
  async publish(event: DiningDomainEvent): Promise<void> {
    // Keep the API layer decoupled from transport; event bus wiring happens in a later milestone.
    console.info('[DiningDomainEvent]', event.type, event.payload);
  }
}
