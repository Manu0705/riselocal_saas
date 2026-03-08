import { Lead } from "../domain/lead.entity";
import { LeadRepository } from "../domain/lead.repository";

/* =========================================
   INPUT TYPE
========================================= */

interface CreateLeadInput {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  location?: string;
}

/* =========================================
   USE CASE
========================================= */

export class CreateLeadUseCase {
  constructor(private readonly repository: LeadRepository) {}

  async execute(input: CreateLeadInput) {
    if (!input.tenantId) {
      throw new Error("tenantId is required");
    }

    const lead = Lead.create({
      tenantId: input.tenantId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      source: input.source,
      location: input.location,
    });

    await this.repository.save(lead);

    return lead.toJSON();
  }
}