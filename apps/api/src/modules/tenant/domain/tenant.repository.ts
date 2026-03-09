import { Tenant } from "./tenant.entity";

/**
 * TenantRepository
 *
 * Domain-level contract.
 * No Prisma. No Express. No framework.
 */
export interface TenantRepository {
  /**
   * Persist a new tenant.
   */
  save(tenant: Tenant): Promise<void>;

  /**
   * Update existing tenant.
   */
  update(tenant: Tenant): Promise<void>;

  /**
   * Find tenant by ID.
   */
  findById(id: string): Promise<Tenant | null>;

  /**
    * Find tenant by slug (used by tenant resolver middleware).
    */
    findBySlug(slug: string): Promise<Tenant | null>;

    /**
   * Find tenant by domain (used by tenant resolver middleware).
   */
  findByDomain(domain: string): Promise<Tenant | null>;

  /**
   * Retrieve all tenants.
   */
  findAllActive(): Promise<Tenant[]>;

  /**
   * Delete a tenant by ID.
   */
  delete(id: string): Promise<void>;
}