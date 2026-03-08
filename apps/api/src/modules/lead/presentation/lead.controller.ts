import { Request, Response } from "express";
import { PrismaLeadRepository } from "../infrastructure/lead.prisma.repository";
import { CreateLeadUseCase } from "../application/create-lead.usecase";
import { UpdateLeadStatusUseCase } from "../application/update-status.usecase";
import { GetAllLeadsUseCase } from "../application/get-all-leads.usecase";

/* =========================================
   Helpers
========================================= */

function getParam(
  value: string | string[] | undefined,
  name: string
): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return Array.isArray(value) ? value[0] : value;
}

/* =========================================
   Repository Instance
========================================= */

const repository = new PrismaLeadRepository();

/* =========================================
   Controller
========================================= */

export class LeadController {
  /* =========================================
     CREATE LEAD
     POST /tenants/:tenantId/leads
  ========================================= */

  async create(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, "tenantId");

      const { name, phone, email, source, location } = req.body;

      const useCase = new CreateLeadUseCase(repository);

      const result = await useCase.execute({
        tenantId,
        name,
        phone,
        email,
        source,
        location,
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
     UPDATE STATUS
     PATCH /tenants/:tenantId/leads/:id/status
  ========================================= */

  async updateStatus(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, "tenantId");
      const id = getParam(req.params.id, "id");

      const { status } = req.body;

      const useCase = new UpdateLeadStatusUseCase(repository);

      const result = await useCase.execute({
        tenantId,
        id,
        status,
      });

      return res.json({
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
     GET ALL LEADS
     GET /tenants/:tenantId/leads
  ========================================= */

  async getAll(req: Request, res: Response) {
    try {
      const tenantId = getParam(req.params.tenantId, "tenantId");

      const useCase = new GetAllLeadsUseCase(repository);

      const result = await useCase.execute({ tenantId });

      return res.json({
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
}