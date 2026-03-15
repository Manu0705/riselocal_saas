import { LeadStatus } from '../domain/lead.entity';
import { LeadRepository } from '../domain/lead.repository';
import { AppError } from '../../../shared/errors/app-error';

/* =========================================
   INPUT
========================================= */

interface UpdateLeadStatusInput {
  tenantId: string;
  id: string;
  status: LeadStatus;
}

/* =========================================
   USE CASE
========================================= */

export class UpdateLeadStatusUseCase {
  constructor(private readonly repository: LeadRepository) {}

  async execute(input: UpdateLeadStatusInput) {
    const lead = await this.repository.findById(input.id, input.tenantId);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Business rule handled inside entity
    lead.updateStatus(input.status);

    await this.repository.update(lead);

    return lead.toJSON();
  }
}
