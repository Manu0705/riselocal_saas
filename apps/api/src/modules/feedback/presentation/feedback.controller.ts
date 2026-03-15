import { Request, Response } from 'express';
import { PrismaFeedbackRepository } from '../infrastructure/feedback.prisma.repository';
import { PrismaTenantConfigProvider } from '../infrastructure/prisma-tenant-config.provider';
import { CreateFeedbackUseCase } from '../application/create-feedback.usecase';

const feedbackRepository = new PrismaFeedbackRepository();
const tenantConfigProvider = new PrismaTenantConfigProvider();

/* =========================================
   PARAM NORMALIZER (TYPE-SAFE)
========================================= */

function getParam(value: string | string[] | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return Array.isArray(value) ? value[0] : value;
}

/* =========================================
   CONTROLLER
========================================= */

export class FeedbackController {
  private canAccessTenant(targetTenantId: string, user?: { tenantId?: string; role?: string }) {
    if (!user?.tenantId) return true;
    const role = String(user.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') return true;
    return user.tenantId === targetTenantId;
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
