// apps/api/src/modules/feedback/infrastructure/feedback.prisma.repository.ts

import { prisma } from '@saas/database';
import { Feedback, FeedbackStatus, FeedbackType } from '../domain/feedback.entity';
import { FeedbackRepository } from '../domain/feedback.repository';

export class PrismaFeedbackRepository implements FeedbackRepository {
  /* =========================================
     CREATE
  ========================================= */

  async save(feedback: Feedback): Promise<void> {
    const data = feedback.toJSON();

    await prisma.feedback.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        leadId: data.leadId,
        comment: data.comment,
        type: data.type,
        rating: data.rating ?? null,
        status: data.status,
        approvedBy: data.approvedBy ?? null,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  /* =========================================
     UPDATE (Tenant Safe)
  ========================================= */

  async update(feedback: Feedback): Promise<void> {
    const data = feedback.toJSON();

    await prisma.feedback.update({
      where: {
        id: data.id,
      },
      data: {
        comment: data.comment,
        type: data.type,
        rating: data.rating ?? null,
        status: data.status,
        approvedBy: data.approvedBy ?? null,
        updatedAt: data.updatedAt,
      },
    });
  }

  /* =========================================
     FIND BY ID (Tenant Isolated)
  ========================================= */

  async findById(id: string): Promise<Feedback | null> {
    const record = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!record) return null;

    return this.mapToEntity(record);
  }

  /* =========================================
     FIND ALL BY TENANT
  ========================================= */

  async findAllByTenant(tenantId: string): Promise<Feedback[]> {
    const records = await prisma.feedback.findMany({
      where: {
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  /* =========================================
     FIND PENDING (MODERATION)
  ========================================= */

  async findPendingByTenant(tenantId: string): Promise<Feedback[]> {
    const records = await prisma.feedback.findMany({
      where: {
        tenantId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  /* =========================================
     PRIVATE MAPPER
  ========================================= */

  private mapToEntity(record: {
    id: string;
    tenantId: string;
    leadId: string;
    comment: string;
    type: string;
    rating: number | null;
    status: string;
    approvedBy: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): Feedback {
    return Feedback.fromPersistence({
      id: record.id,
      tenantId: record.tenantId,
      leadId: record.leadId,
      comment: record.comment,
      type: record.type as FeedbackType,
      rating: record.rating,
      status: record.status as FeedbackStatus,
      approvedBy: record.approvedBy,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
