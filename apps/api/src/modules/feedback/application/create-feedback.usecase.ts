import { Feedback } from '../domain/feedback.entity';
import { FeedbackRepository } from '../domain/feedback.repository';

/* =========================================
   DEPENDENCIES REQUIRED
========================================= */

export interface TenantConfig {
  id: string;
  feedbackAllowsRating: boolean;
  feedbackRequiresApproval: boolean;
}

export interface TenantConfigProvider {
  getTenantConfig(tenantId: string): Promise<TenantConfig | null>;
}

/* =========================================
   INPUT DTO
========================================= */

interface CreateFeedbackInput {
  tenantId: string;
  leadId: string;
  comment: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  rating?: number;
  createdBy: string;
}

/* =========================================
   USE CASE
========================================= */

export class CreateFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly tenantConfigProvider: TenantConfigProvider,
  ) {}

  async execute(input: CreateFeedbackInput): Promise<{ id: string }> {
    if (!input.tenantId) {
      throw new Error('tenantId is required');
    }

    if (!input.leadId) {
      throw new Error('leadId is required');
    }

    if (!input.createdBy) {
      throw new Error('createdBy is required');
    }

    // Load tenant configuration
    const tenantConfig = await this.tenantConfigProvider.getTenantConfig(input.tenantId);

    if (!tenantConfig) {
      throw new Error('Tenant not found');
    }

    // Create entity with tenant-driven behavior
    const feedback = Feedback.create({
      tenantId: input.tenantId,
      leadId: input.leadId,
      comment: input.comment,
      type: input.type,
      rating: input.rating,
      createdBy: input.createdBy,
      tenantConfig: {
        feedbackAllowsRating: tenantConfig.feedbackAllowsRating,
        feedbackRequiresApproval: tenantConfig.feedbackRequiresApproval,
      },
    });

    await this.feedbackRepository.save(feedback);

    return { id: feedback.id };
  }
}
