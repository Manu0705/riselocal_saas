import { Feedback } from './feedback.entity';

/**
 * FeedbackRepository
 *
 * Domain-level persistence contract.
 *
 * This interface defines WHAT operations are required
 * without specifying HOW they are implemented.
 *
 * Multi-tenant safe:
 * All read operations must be scoped by tenantId.
 */
export interface FeedbackRepository {
  /**
   * Persist a new Feedback entity.
   */
  save(feedback: Feedback): Promise<void>;

  /**
   * Update an existing Feedback entity.
   */
  update(feedback: Feedback): Promise<void>;

  /**
   * Retrieve a Feedback by ID.
   */
  findById(id: string): Promise<Feedback | null>;

  /**
   * Retrieve all feedback for a tenant.
   */
  findAllByTenant(tenantId: string): Promise<Feedback[]>;

  /**
   * Retrieve all pending feedback for moderation.
   */
  findPendingByTenant(tenantId: string): Promise<Feedback[]>;
}
