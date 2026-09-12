import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { HostelPropertyService } from '../application/hostel-property.service';

const service = new HostelPropertyService();

type HostelRequest = Request & {
  tenant?: { id: string };
};

function getTenantId(req: Request): string | null {
  const request = req as HostelRequest;
  const tenantId = request.tenant?.id ?? req.params.tenantId;
  return typeof tenantId === 'string' && tenantId.trim() ? tenantId.trim() : null;
}

function getHostelId(req: Request): unknown {
  return typeof req.query.hostelId === 'string' ? req.query.hostelId : undefined;
}

function isStudentRole(req: Request): boolean {
  return String(req.user?.role ?? '').toLowerCase() === 'student';
}

function getPageValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getActorId(req: Request): string | undefined {
  return typeof req.user?.id === 'string' ? req.user.id : undefined;
}

function withIdempotencyKey(req: Request): Record<string, unknown> {
  const body = { ...(req.body ?? {}) } as Record<string, unknown>;
  const header = req.headers['x-idempotency-key'];
  if (typeof header === 'string' && !body.idempotencyKey) body.idempotencyKey = header;
  return body;
}

async function respond(req: Request, res: Response, action: () => Promise<unknown>, status = 200) {
  try {
    const result = await action();
    if (result === null) {
      return sendError(res, 404, 'Student not found', { code: 'NOT_FOUND', req });
    }
    return sendSuccess(res, status, result, req);
  } catch (error: unknown) {
    return sendError(res, 400, error instanceof Error ? error.message : 'Invalid hostel request', {
      code: 'VALIDATION_ERROR',
      req,
    });
  }
}

export class HostelController {
  listHostels(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.listHostels(tenantId));
  }

  createHostel(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.createHostel(tenantId, req.body?.name), 201);
  }

  listRooms(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listRooms(
        tenantId,
        getHostelId(req),
        getPageValue(req.query.page, 1),
        getPageValue(req.query.limit, 25),
        req.query.search,
      ),
    );
  }

  createRoom(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.createRoom(tenantId, req.body ?? {}), 201);
  }

  getRoom(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () => service.getRoom(tenantId, req.params.id));
  }

  updateRoom(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () => service.updateRoom(tenantId, req.params.id, req.body ?? {}));
  }

  deleteRoom(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () => service.deleteRoom(tenantId, req.params.id));
  }

  listVacancies(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () => service.listVacancies(tenantId, getHostelId(req)));
  }

  vacancySummary(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () => service.vacancySummary(tenantId, getHostelId(req)));
  }

  hostelDashboardSummary(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });

    return respond(req, res, () =>
      service.hostelDashboardSummary(tenantId, getHostelId(req)),
    );
  }

  allocateStudent(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(
      req,
      res,
      () => service.allocateStudent(tenantId, req.body ?? {}, getActorId(req)),
      201,
    );
  }

  deallocateStudent(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(
      req,
      res,
      () => service.deallocateStudent(tenantId, req.body ?? {}, getActorId(req)),
      201,
    );
  }

  autoAllocateStudent(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(
      req,
      res,
      () => service.autoAllocateStudent(tenantId, req.body ?? {}, getActorId(req)),
      201,
    );
  }

  allocationHistory(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () => service.allocationHistory(tenantId, req.params.id));
  }
  
  recentAllocationActivity(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.recentAllocationActivity(
        tenantId,
        req.query.hostelId,
        req.query.limit,
      ),
    );
  }

  listStudents(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () =>
      service.listStudents(tenantId, {
        hostelId: getHostelId(req),
        roomId: req.query.roomId,
        paymentStatus: req.query.paymentStatus,
        status: req.query.status,
        search: req.query.search,
        userId: isStudentRole(req) ? req.user?.id : undefined,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getStudent(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () =>
      service.getStudent(tenantId, req.params.id, isStudentRole(req) ? req.user?.id : undefined),
    );
  }

  createStudent(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.createStudent(tenantId, req.body ?? {}), 201);
  }

  updateStudent(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.updateStudent(tenantId, req.params.id, req.body ?? {}));
  }

  listStaff(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.listStaff(tenantId, getHostelId(req)));
  }

  listAvailableStaffUsers(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listAvailableStaffUsers(tenantId),
    );
  }


  deleteStaffAssignment(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.deleteStaffAssignment(tenantId, {
        hostelId: req.query.hostelId,
        assignmentId: req.params.id,
      }),
    );
  }

  updateStaffAssignment(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.updateStaffAssignment(tenantId, {
        hostelId: req.query.hostelId,
        assignmentId: req.params.id,
        role: req.body.role,
      }),
    );
  }

  createStaff(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }
    return respond(req, res, () => service.createStaff(tenantId, req.body ?? {}), 201);
  }
  initiatePayment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(
      req,
      res,
      async () => {
        const body = { ...(req.body ?? {}) } as Record<string, unknown>;
        if (isStudentRole(req)) body.studentId = undefined;
        const payment = (await service.initiatePayment(
          tenantId,
          isStudentRole(req) ? { ...body, studentUserId: req.user?.id } : body,
        )) as Record<string, unknown>;
        const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
        const params = new URLSearchParams({
          pa: String(payment.upiVpa ?? ''),
          pn: String(metadata.payeeName ?? ''),
          am: String(payment.amount),
          cu: String(payment.currency ?? 'INR'),
          tn: `RiseLocal payment ${payment.id}`,
        });
        return {
          ...payment,
          upiPayload: `upi://pay?${params.toString()}`,
          manualInstructions:
            'Complete the payment in your UPI app, then submit the UTR here. RiseLocal does not process or confirm the bank transfer automatically.',
        };
      },
      201,
    );
  }

  listPayments(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () =>
      service.listPayments(tenantId, {
        studentId: isStudentRole(req)
          ? undefined
          : typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,
        studentUserId: isStudentRole(req) ? req.user?.id : undefined,
        status: req.query.status,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getPayment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () =>
      service.getPayment(
        tenantId,
        req.params.id,
        undefined,
        isStudentRole(req) ? req.user?.id : undefined,
      ),
    );
  }

  submitPayment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () =>
      service.submitPayment(
        tenantId,
        req.params.id,
        withIdempotencyKey(req),
        undefined,
        isStudentRole(req) ? req.user?.id : undefined,
      ),
    );
  }

  verifyPayment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () =>
      service.verifyPayment(
        tenantId,
        req.params.id,
        withIdempotencyKey(req),
        getActorId(req) ?? '',
      ),
    );
  }

  rejectPayment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    return respond(req, res, () =>
      service.rejectPayment(
        tenantId,
        req.params.id,
        withIdempotencyKey(req),
        getActorId(req) ?? '',
      ),
    );
  }
}
