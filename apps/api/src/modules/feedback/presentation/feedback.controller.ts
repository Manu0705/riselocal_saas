import { Request, Response } from 'express';
import { prisma } from '@saas/database';
import { PrismaFeedbackRepository } from '../infrastructure/feedback.prisma.repository';
import { PrismaTenantConfigProvider } from '../infrastructure/prisma-tenant-config.provider';
import { CreateFeedbackUseCase } from '../application/create-feedback.usecase';
import { LeadLifecycleService } from '../../lead/infrastructure/lead-lifecycle.service';
import { isAdminRole } from '@saas/domain-core/auth.contract';
import { sendError, sendSuccess } from '../../../shared/http/api-response';

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
        return sendError(res, 404, 'Tenant not found', { code: 'NOT_FOUND', req });
      }

      if (!applyPublicFeedbackRateLimit(req, tenant.id)) {
        return sendError(res, 429, 'Too many feedback submissions. Please retry shortly.', {
          code: 'RATE_LIMITED',
          req,
        });
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
          return sendError(res, 404, 'Lead not found', { code: 'NOT_FOUND', req });
        }
      } else {
        const normalizedName = String(name ?? '').trim();
        const normalizedPhone = String(phone ?? '').trim();

        if (!normalizedName || !normalizedPhone) {
          return sendError(res, 400, 'leadId or name+phone is required', {
            code: 'VALIDATION_ERROR',
            req,
          });
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

      return sendSuccess(
        res,
        201,
        {
          id: result.id,
          leadId: resolvedLeadId,
        },
        req,
      );
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to submit feedback', {
        code: 'VALIDATION_ERROR',
        req,
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
        return sendError(res, 400, 'leadId is required', { code: 'VALIDATION_ERROR', req });
      }

      if (typeof rating !== 'number' || Number.isNaN(rating)) {
        return sendError(res, 400, 'rating is required', { code: 'VALIDATION_ERROR', req });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });

      if (!tenant) {
        return sendError(res, 404, 'Tenant not found', { code: 'NOT_FOUND', req });
      }

      if (!applyPublicFeedbackRateLimit(req, tenant.id)) {
        return sendError(res, 429, 'Too many review submissions. Please retry shortly.', {
          code: 'RATE_LIMITED',
          req,
        });
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
        return sendError(res, 404, 'Converted lead not found', { code: 'NOT_FOUND', req });
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

      return sendSuccess(
        res,
        201,
        {
          id: result.id,
          leadId: normalizedLeadId,
        },
        req,
      );
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to submit review', {
        code: 'VALIDATION_ERROR',
        req,
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

      return sendSuccess(res, 201, result, req);
    } catch (error: any) {
      return sendError(res, 400, error.message, { code: 'VALIDATION_ERROR', req });
    }
  }

  /* =========================================
     LIST ALL FEEDBACK (TENANT SAFE)
  ========================================= */

  async listByTenant(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, 'tenantId');

      const feedbacks = await feedbackRepository.findAllByTenant(tenantId);

      return sendSuccess(
        res,
        200,
        feedbacks.map((f) => f.toJSON()),
        req,
      );
    } catch (error: any) {
      return sendError(res, 500, error.message, { code: 'INTERNAL_ERROR', req });
    }
  }

  /* =========================================
     LIST PENDING (MODERATION)
  ========================================= */

  async listPending(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, 'tenantId');

      const feedbacks = await feedbackRepository.findPendingByTenant(tenantId);

      return sendSuccess(
        res,
        200,
        feedbacks.map((f) => f.toJSON()),
        req,
      );
    } catch (error: any) {
      return sendError(res, 500, error.message, { code: 'INTERNAL_ERROR', req });
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
        return sendError(res, 404, 'Feedback not found', { code: 'NOT_FOUND', req });
      }

      if (!this.canAccessTenant(feedback.toJSON().tenantId, req.user)) {
        return sendError(res, 403, 'Access denied for this tenant', { code: 'FORBIDDEN', req });
      }

      const approvedBy = req.user?.id || 'system';

      feedback.approve(approvedBy);

      await feedbackRepository.update(feedback);

      return sendSuccess(res, 200, { message: 'Feedback approved' }, req);
    } catch (error: any) {
      return sendError(res, 400, error.message, { code: 'VALIDATION_ERROR', req });
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
        return sendError(res, 404, 'Feedback not found', { code: 'NOT_FOUND', req });
      }

      if (!this.canAccessTenant(feedback.toJSON().tenantId, req.user)) {
        return sendError(res, 403, 'Access denied for this tenant', { code: 'FORBIDDEN', req });
      }

      const rejectedBy = req.user?.id || 'system';

      feedback.reject(rejectedBy);

      await feedbackRepository.update(feedback);

      return sendSuccess(res, 200, { message: 'Feedback rejected' }, req);
    } catch (error: any) {
      return sendError(res, 400, error.message, { code: 'VALIDATION_ERROR', req });
    }
  }
}
