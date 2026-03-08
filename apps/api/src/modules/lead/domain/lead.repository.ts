import { Lead } from "./lead.entity";

/**
 * LeadRepository
 *
 * Domain-level persistence contract.
 *
 * Multi-tenant safe:
 * All read operations must be scoped by tenantId.
 */
export interface LeadRepository {
  /**
   * Persist a new Lead.
   */
  save(lead: Lead): Promise<void>;

  /**
   * Retrieve a Lead by ID.
   */
  findById(id: string, tenantId: string): Promise<Lead | null>;

  /**
   * Retrieve all Leads for a tenant.
   */
  findAllByTenant(tenantId: string): Promise<Lead[]>;

  /**
   * Update an existing Lead.
   */
  update(lead: Lead): Promise<void>;
}