import { Request, Response } from 'express';
import { prisma } from '@saas/database';
import { PrismaFeedbackRepository } from '../infrastructure/feedback.prisma.repository';
import { PrismaTenantConfigProvider } from '../infrastructure/prisma-tenant-config.provider';
import { CreateFeedbackUseCase } from '../application/create-feedback.usecase';
import { LeadLifecycleService } from '../../lead/infrastructure/lead-lifecycle.service';
import { isAdminRole } from '@saas/domain-core/auth.contract';

const feedbackRepository = new PrismaFeedbackRepository();
const tenantConfigProvider = new PrismaTenantConfigProvider();
const lifecycleService = new LeadLifecycleService();
const PUBLIC_FEEDBACK_WINDOW_MS = 60_000;
const PUBLIC_FEEDBACK_LIMIT = 10;
const publicFeedbackBuckets = new Map<string, { count: number; resetAt: number }>();

/* =========================================
   PARAM NORMALIZER (TYPE-SAFE)
========================================= */

function getParam(value: string | string[] | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return Array.isArray(value) ? value[0] : value;
}

function normalizeFeedbackType(rating?: number, requestedType?: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
  const normalizedRequested = String(requestedType ?? '')
    .trim()
    .toUpperCase();
  if (normalizedRequested === 'POSITIVE' || normalizedRequested === 'NEGATIVE' || normalizedRequested === 'NEUTRAL') {
    return normalizedRequested;
  }

  if (typeof rating !== 'number' || Number.isNaN(rating)) {
    return 'NEUTRAL';
  }

  if (rating >= 4) return 'POSITIVE';
  if (rating <= 2) return 'NEGATIVE';
  return 'NEUTRAL';
}

function applyPublicFeedbackRateLimit(req: Request, tenantId: string): boolean {
  const ip = String(req.ip || req.socket.remoteAddress || 'unknown').trim();
  const key = `${ip}:${tenantId}:feedback`;
  const now = Date.now();
  const current = publicFeedbackBuckets.get(key);

  if (!current || current.resetAt < now) {
    publicFeedbackBuckets.set(key, { count: 1, resetAt: now + PUBLIC_FEEDBACK_WINDOW_MS });
    return true;
  }

  current.count += 1;
  return current.count <= PUBLIC_FEEDBACK_LIMIT;
}

/* =========================================
   CONTROLLER
========================================= */

export class FeedbackController {
  private canAccessTenant(targetTenantId: string, user?: { tenantId?: string; role?: string }) {
    if (!user?.tenantId) return true;
    if (isAdminRole(user.role)) return true;
    return user.tenantId === targetTenantId;
  }

  /* =========================================
     PUBLIC CREATE FEEDBACK (NO AUTH)
  ========================================= */

  async publicCreate(req: Request, res: Response) {
    try {
      const tenantSlug = getParam(req.params.tenantSlug, 'tenantSlug').trim().toLowerCase();
      const { leadId, comment, type, rating, name, phone } = req.body as {
        leadId?: string;
        comment?: string;
        type?: string;
        rating?: number;
        name?: string;
        phone?: string;
      };

      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      if (!applyPublicFeedbackRateLimit(req, tenant.id)) {
        return res.status(429).json({ success: false, message: 'Too many feedback submissions. Please retry shortly.' });
      }

      let resolvedLeadId = String(leadId ?? '').trim();

      if (resolvedLeadId) {
        const lead = await prisma.lead.findFirst({
          where: {
            id: resolvedLeadId,
            tenantId: tenant.id,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!lead) {
          return res.status(404).json({ success: false, message: 'Lead not found' });
        }
      } else {
        const normalizedName = String(name ?? '').trim();
        const normalizedPhone = String(phone ?? '').trim();

        if (!normalizedName || !normalizedPhone) {
          return res.status(400).json({ success: false, message: 'leadId or name+phone is required' });
        }

        const leadResult = await lifecycleService.upsertLead({
          tenantId: tenant.id,
          name: normalizedName,
          phone: normalizedPhone,
          source: 'FEEDBACK',
          actionType: 'enquiry_click',
          notes: 'Created from public feedback form',
          metadata: {
            pageUrl: req.get('origin') ?? null,
            userAgent: req.get('user-agent') ?? null,
            campaignSource: 'public_feedback_form',
          },
        });

        resolvedLeadId = leadResult.leadId;
      }

      const useCase = new CreateFeedbackUseCase(feedbackRepository, tenantConfigProvider);

      const result = await useCase.execute({
        tenantId: tenant.id,
        leadId: resolvedLeadId,
        comment: String(comment ?? ''),
        type: normalizeFeedbackType(typeof rating === 'number' ? rating : undefined, type),
        rating: typeof rating === 'number' ? rating : undefined,
        createdBy: 'customer',
      });

      return res.status(201).json({
        success: true,
        data: {
          id: result.id,
          leadId: resolvedLeadId,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error?.message ?? 'Failed to submit feedback',
      });
    }
  }

  /* =========================================
     PUBLIC CREATE REVIEW (NO AUTH)
  ========================================= */

  async publicCreateReview(req: Request, res: Response) {
    try {
      const tenantSlug = getParam(req.params.tenantSlug, 'tenantSlug').trim().toLowerCase();
      const { leadId, comment, rating } = req.body as {
        leadId?: string;
        comment?: string;
        rating?: number;
      };

      const normalizedLeadId = String(leadId ?? '').trim();
      if (!normalizedLeadId) {
        return res.status(400).json({ success: false, message: 'leadId is required' });
      }

      if (typeof rating !== 'number' || Number.isNaN(rating)) {
        return res.status(400).json({ success: false, message: 'rating is required' });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      if (!applyPublicFeedbackRateLimit(req, tenant.id)) {
        return res.status(429).json({ success: false, message: 'Too many review submissions. Please retry shortly.' });
      }

      const lead = await prisma.lead.findFirst({
        where: {
          id: normalizedLeadId,
          tenantId: tenant.id,
          deletedAt: null,
          status: 'CONVERTED',
        },
        select: { id: true },
      });

      if (!lead) {
        return res.status(404).json({ success: false, message: 'Converted lead not found' });
      }

      const useCase = new CreateFeedbackUseCase(feedbackRepository, tenantConfigProvider);

      const result = await useCase.execute({
        tenantId: tenant.id,
        leadId: normalizedLeadId,
        comment: String(comment ?? ''),
        type: normalizeFeedbackType(rating),
        rating,
        createdBy: 'customer',
      });

      return res.status(201).json({
        success: true,
        data: {
          id: result.id,
          leadId: normalizedLeadId,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error?.message ?? 'Failed to submit review',
      });
    }
  }

  /* =========================================
     CREATE FEEDBACK
  ========================================= */

  async create(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, 'tenantId');
      const { leadId, comment, type, rating } = req.body;

      const createdBy = req.user?.id || 'system';

      const useCase = new CreateFeedbackUseCase(feedbackRepository, tenantConfigProvider);

      const result = await useCase.execute({
        tenantId,
        leadId,
        comment,
        type,
        rating,
        createdBy,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /* =========================================
     LIST ALL FEEDBACK (TENANT SAFE)
  ========================================= */

  async listByTenant(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, 'tenantId');

      const feedbacks = await feedbackRepository.findAllByTenant(tenantId);

      return res.json({
        success: true,
        data: feedbacks.map((f) => f.toJSON()),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /* =========================================
     LIST PENDING (MODERATION)
  ========================================= */

  async listPending(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, 'tenantId');

      const feedbacks = await feedbackRepository.findPendingByTenant(tenantId);

      return res.json({
        success: true,
        data: feedbacks.map((f) => f.toJSON()),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /* =========================================
     APPROVE FEEDBACK
  ========================================= */

  async approve(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id, 'id');

      const feedback = await feedbackRepository.findById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found',
        });
      }

      if (!this.canAccessTenant(feedback.toJSON().tenantId, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this tenant',
        });
      }

      const approvedBy = req.user?.id || 'system';

      feedback.approve(approvedBy);

      await feedbackRepository.update(feedback);

      return res.json({
        success: true,
        message: 'Feedback approved',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /* =========================================
     REJECT FEEDBACK
  ========================================= */

  async reject(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id, 'id');

      const feedback = await feedbackRepository.findById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found',
        });
      }

      if (!this.canAccessTenant(feedback.toJSON().tenantId, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this tenant',
        });
      }

      const rejectedBy = req.user?.id || 'system';

      feedback.reject(rejectedBy);

      await feedbackRepository.update(feedback);

      return res.json({
        success: true,
        message: 'Feedback rejected',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
