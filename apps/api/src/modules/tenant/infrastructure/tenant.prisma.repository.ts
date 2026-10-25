import { prisma, type Tenant as PrismaTenant } from '@saas/database';
import { Tenant } from '../domain/tenant.entity';
import { TenantRepository } from '../domain/tenant.repository';
import { withDatabaseReadRetry } from '../../../shared/database/database-read-retry';

export class PrismaTenantRepository implements TenantRepository {
  /* =========================================
     CREATE
  ========================================= */

  async save(tenant: Tenant): Promise<void> {
    const data = tenant.toJSON();

    await prisma.tenant.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        domain: data.domain ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  /* =========================================
     UPDATE
  ========================================= */

  async update(tenant: Tenant): Promise<void> {
    const data = tenant.toJSON();

    await prisma.tenant.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain ?? null,
        updatedAt: data.updatedAt,
      },
    });
  }

  /* =========================================
     FIND BY ID
  ========================================= */

  async findById(id: string): Promise<Tenant | null> {
    const record: PrismaTenant | null = await withDatabaseReadRetry(
      () => prisma.tenant.findUnique({ where: { id } }),
      'tenant.findById',
    );

    if (!record) return null;

    return Tenant.fromPersistence({
      id: record.id,
      name: record.name,
      slug: record.slug,
      domain: record.domain,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /* =========================================
     FIND BY SLUG
  ========================================= */

  async findBySlug(slug: string): Promise<Tenant | null> {
    const record: PrismaTenant | null = await withDatabaseReadRetry(
      () => prisma.tenant.findUnique({ where: { slug } }),
      'tenant.findBySlug',
    );

    if (!record) return null;

    return Tenant.fromPersistence({
      id: record.id,
      name: record.name,
      slug: record.slug,
      domain: record.domain,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /* =========================================
     FIND BY DOMAIN (CRITICAL FOR MIDDLEWARE)
  ========================================= */

  async findByDomain(domain: string): Promise<Tenant | null> {
    const record: PrismaTenant | null = await withDatabaseReadRetry(
      () => prisma.tenant.findFirst({ where: { domain } }),
      'tenant.findByDomain',
    );

    if (!record) return null;

    return Tenant.fromPersistence({
      id: record.id,
      name: record.name,
      slug: record.slug,
      domain: record.domain,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /* =========================================
     FIND ALL ACTIVE
  ========================================= */

  async findAllActive(): Promise<Tenant[]> {
    const records: PrismaTenant[] = await withDatabaseReadRetry(
      () => prisma.tenant.findMany({ where: {}, orderBy: { createdAt: 'desc' } }),
      'tenant.findAllActive',
    );

    return records.map((record) =>
      Tenant.fromPersistence({
        id: record.id,
        name: record.name,
        slug: record.slug,
        domain: record.domain,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }),
    );
  }

  /* =========================================
     DELETE
  ========================================= */

  async delete(id: string): Promise<void> {
    await prisma.tenant.delete({
      where: { id },
    });
  }
}
