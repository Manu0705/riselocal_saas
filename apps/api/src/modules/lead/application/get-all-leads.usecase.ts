import { LeadRepository } from '../domain/lead.repository';

/* =========================================
   INPUT
========================================= */

interface GetAllLeadsInput {
  tenantId: string;
}

/* =========================================
   USE CASE
========================================= */

export class GetAllLeadsUseCase {
  constructor(private readonly repository: LeadRepository) {}

  async execute(input: GetAllLeadsInput) {
    if (!input.tenantId) {
      throw new Error('tenantId is required');
    }

    const leads = await this.repository.findAllByTenant(input.tenantId);

    return leads.map((lead) => lead.toJSON());
  }
}
