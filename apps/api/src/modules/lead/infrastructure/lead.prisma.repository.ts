import { prisma } from "@saas/database";
import { Lead as PrismaLead } from "@prisma/client";
import { Lead } from "../domain/lead.entity";
import { LeadRepository } from "../domain/lead.repository";

export class PrismaLeadRepository implements LeadRepository {
  /* =========================================
     CREATE
  ========================================= */

  async save(lead: Lead): Promise<void> {
    const data = lead.toJSON();

    await prisma.lead.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email ?? "unknown@example.com",
        source: data.source ?? undefined,
        location: data.location ?? null,
        status: data.status,
        createdAt: data.createdAt,
      },
    });
  }

  /* =========================================
     UPDATE
  ========================================= */

  async update(lead: Lead): Promise<void> {
    const data = lead.toJSON();

    await prisma.lead.update({
      where: { 
        id: data.id,
        tenantId: data.tenantId, // 🔒 prevents cross-tenant update
       },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email ?? "unknown@example.com",
        source: data.source ?? undefined,
        location: data.location ?? null,
        status: data.status,
      },
    });
  }

  /* =========================================
     FIND BY ID
  ========================================= */

  async findById(id: string, tenantId: string): Promise<Lead | null> {
    const record = await prisma.lead.findFirst({
      where: {
        id,
        tenantId, // 🔒 isolation enforced
      },
    });

    if (!record) return null;

    return Lead.fromPersistence({
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      phone: record.phone,
      email: record.email,
      source: record.source,
      status: record.status as any,
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
    });
  }

  /* =========================================
     FIND ALL BY TENANT (Multi-Tenant Safe)
  ========================================= */

  async findAllByTenant(tenantId: string): Promise<Lead[]> {
    const records: PrismaLead[] = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) =>
      Lead.fromPersistence({
        id: record.id,
        tenantId: record.tenantId,
        name: record.name,
        phone: record.phone,
        email: record.email,
        source: record.source,
        status: record.status as any,
        createdAt: record.createdAt,
        updatedAt: record.createdAt,
      })
    );
  }
}