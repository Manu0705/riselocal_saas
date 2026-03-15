import { TenantRepository } from '../domain/tenant.repository';

/* =========================================
   INPUT
========================================= */

interface GetTenantByDomainInput {
  domain?: string;
  slug?: string;
}

/* =========================================
   USE CASE
========================================= */

export class GetTenantByDomainUseCase {
  constructor(private readonly repository: TenantRepository) {}

  async execute(input: GetTenantByDomainInput) {
    if (!input.domain && !input.slug) {
      throw new Error('Domain or slug is required');
    }

    const tenant = input.slug
      ? await this.repository.findBySlug(input.slug.trim().toLowerCase())
      : await this.repository.findByDomain(String(input.domain).trim().toLowerCase());

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant.toJSON();
  }
}
