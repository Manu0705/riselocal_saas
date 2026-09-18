import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { HostelPropertyService } from '../application/hostel-property.service';
import { StudentLoginUseCase } from '../application/student/student-login.use-case';

const service = new HostelPropertyService();
const studentLoginUseCase = new StudentLoginUseCase();

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
//   studentLogin(req: Request, res: Response) {
//   const tenantSlug =
//     typeof req.body?.tenantSlug === 'string'
//       ? req.body.tenantSlug
//       : '';

//   const studentIdOrMobile =
//     typeof req.body?.studentIdOrMobile === 'string'
//       ? req.body.studentIdOrMobile
//       : '';

//   const passkey =
//     typeof req.body?.passkey === 'string'
//       ? req.body.passkey
//       : '';

//   return respond(req, res, () =>
//     studentLoginUseCase.execute({
//       tenantSlug,
//       studentIdOrMobile,
//       passkey,
//     }),
//   );
// }

studentLogin(req: Request, res: Response) {
  const tenantSlug =
    typeof req.body?.tenantSlug === 'string'
      ? req.body.tenantSlug
      : '';

  const identifier =
    typeof req.body?.identifier === 'string'
      ? req.body.identifier
      : '';

  const passkey =
    typeof req.body?.passkey === 'string'
      ? req.body.passkey
      : '';

  return respond(req, res, () =>
    studentLoginUseCase.execute({
      tenantSlug,
      identifier,
      passkey,
    }),
  );
}
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

  listFees(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.listFees(tenantId, {
        hostelId: getHostelId(req),
        isActive: req.query.isActive,
        type: req.query.type,
        search: req.query.search,
      }),
    );
  }

  createFee(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () => service.createFee(tenantId, req.body ?? {}), 201);
  }

  getFee(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () => service.getFee(tenantId, req.params.id));
  }

  updateFee(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.updateFee(tenantId, req.params.id, req.body ?? {}),
    );
  }

  deactivateFee(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () => service.deactivateFee(tenantId, req.params.id));
  }

  listFeeAssignments(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.listFeeAssignments(tenantId, {
        hostelId: getHostelId(req),
        studentId: typeof req.query.studentId === 'string' ? req.query.studentId : undefined,
        feeId: typeof req.query.feeId === 'string' ? req.query.feeId : undefined,
        status: req.query.status,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  createFeeAssignment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(
      req,
      res,
      () => service.createFeeAssignment(tenantId, req.body ?? {}),
      201,
    );
  }

  getFeeAssignment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.getFeeAssignment(tenantId, req.params.id),
    );
  }

  updateFeeAssignment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.updateFeeAssignment(tenantId, req.params.id, req.body ?? {}),
    );
  }

  cancelFeeAssignment(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.cancelFeeAssignment(tenantId, req.params.id),
    );
  }

  listInvoices(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.listInvoices(tenantId, {
        hostelId: getHostelId(req),
        studentId: typeof req.query.studentId === 'string' ? req.query.studentId : undefined,
        status: req.query.status,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getInvoice(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () => service.getInvoice(tenantId, req.params.id));
  }

  createInvoice(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () => service.createInvoice(tenantId, req.body ?? {}), 201);
  }

  updateInvoice(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.updateInvoice(tenantId, req.params.id, req.body ?? {}),
    );
  }

  issueInvoice(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.issueInvoice(tenantId, req.params.id),
    );
  }

  cancelInvoice(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });
    }

    return respond(req, res, () =>
      service.cancelInvoice(tenantId, req.params.id),
    );
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

  listReceipts(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });

    return respond(req, res, () =>
      service.listReceipts(tenantId, {
        studentId: isStudentRole(req)
          ? undefined
          : typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,
        studentUserId: isStudentRole(req) ? req.user?.id : undefined,
        paymentId: typeof req.query.paymentId === 'string' ? req.query.paymentId : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getReceipt(req: Request, res: Response) {
    const tenantId = getTenantId(req);
    if (!tenantId)
      return sendError(res, 400, 'Tenant context is required', { code: 'VALIDATION_ERROR', req });

    return respond(req, res, () =>
      service.getReceipt(
        tenantId,
        req.params.id,
        isStudentRole(req) ? req.user?.id : undefined,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  getFeeCollectionSummary(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.getFeeCollectionSummary(tenantId, {
        hostelId:
          typeof req.query.hostelId === 'string'
            ? req.query.hostelId
            : undefined,

        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,

        from:
          typeof req.query.from === 'string'
            ? req.query.from
            : undefined,

        to:
          typeof req.query.to === 'string'
            ? req.query.to
            : undefined,
      }),
    );
  }

  listStudentOutstandingReport(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listStudentOutstandingReport(tenantId, {
        hostelId:
          typeof req.query.hostelId === 'string'
            ? req.query.hostelId
            : undefined,

        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,

        page: getPageValue(req.query.page, 1),

        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  listInvoiceReport(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listInvoiceReport(tenantId, {
        hostelId:
          typeof req.query.hostelId === 'string'
            ? req.query.hostelId
            : undefined,

        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,

        status:
          typeof req.query.status === 'string'
            ? req.query.status
            : undefined,

        from:
          typeof req.query.from === 'string'
            ? req.query.from
            : undefined,

        to:
          typeof req.query.to === 'string'
            ? req.query.to
            : undefined,

        page: getPageValue(req.query.page, 1),

        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  listPaymentReport(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listPaymentReport(tenantId, {
        hostelId:
          typeof req.query.hostelId === 'string'
            ? req.query.hostelId
            : undefined,

        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,

        status:
          typeof req.query.status === 'string'
            ? req.query.status
            : undefined,

        from:
          typeof req.query.from === 'string'
            ? req.query.from
            : undefined,

        to:
          typeof req.query.to === 'string'
            ? req.query.to
            : undefined,

        page: getPageValue(req.query.page, 1),

        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  listReceiptReport(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listReceiptReport(tenantId, {
        hostelId:
          typeof req.query.hostelId === 'string'
            ? req.query.hostelId
            : undefined,

        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,

        from:
          typeof req.query.from === 'string'
            ? req.query.from
            : undefined,

        to:
          typeof req.query.to === 'string'
            ? req.query.to
            : undefined,

        page: getPageValue(req.query.page, 1),

        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Reconciliation
  // ---------------------------------------------------------------------------

  listPaymentReconciliation(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listPaymentReconciliation(tenantId, {
        hostelId:
          typeof req.query.hostelId === 'string'
            ? req.query.hostelId
            : undefined,

        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,

        from:
          typeof req.query.from === 'string'
            ? req.query.from
            : undefined,

        to:
          typeof req.query.to === 'string'
            ? req.query.to
            : undefined,

        page: getPageValue(req.query.page, 1),

        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Deposits
  // ---------------------------------------------------------------------------

  listDeposits(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listDeposits(tenantId, {
        hostelId: getHostelId(req),
        status: req.query.status,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getDeposit(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.getDeposit(tenantId, req.params.id),
    );
  }

  createDeposit(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(
      req,
      res,
      () => service.createDeposit(tenantId, req.body ?? {}, getActorId(req)),
      201,
    );
  }

  updateDeposit(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.updateDeposit(
        tenantId,
        req.params.id,
        req.body ?? {},
      ),
    );
  }

  reconcileDeposit(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.reconcileDeposit(tenantId, req.params.id),
    );
  }

  cancelDeposit(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.cancelDeposit(tenantId, req.params.id),
    );
  }

  // ---------------------------------------------------------------------------
  // Ledger
  // ---------------------------------------------------------------------------

  listLedgerEntries(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listLedgerEntries(tenantId, {
        hostelId: getHostelId(req),
        type: req.query.type,
        direction: req.query.direction,
        from: req.query.from,
        to: req.query.to,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getLedgerEntry(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.getLedgerEntry(tenantId, req.params.id),
    );
  }

  createLedgerEntry(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(
      req,
      res,
      () =>
        service.createLedgerEntry(
          tenantId,
          req.body ?? {},
          getActorId(req),
        ),
      201,
    );
  }

  // ---------------------------------------------------------------------------
  // Complaints
  // ---------------------------------------------------------------------------

  listComplaints(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listComplaints(tenantId, {
        hostelId: getHostelId(req),
        studentId:
          typeof req.query.studentId === 'string'
            ? req.query.studentId
            : undefined,
        assignedTo:
          typeof req.query.assignedTo === 'string'
            ? req.query.assignedTo
            : undefined,
        priority: req.query.priority,
        status: req.query.status,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getComplaint(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.getComplaint(tenantId, req.params.id),
    );
  }

  createComplaint(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(
      req,
      res,
      () =>
        service.createComplaint(tenantId, req.body ?? {}),
      201,
    );
  }

  updateComplaint(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.updateComplaint(
        tenantId,
        req.params.id,
        req.body ?? {},
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Announcements
  // ---------------------------------------------------------------------------

  listAnnouncements(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.listAnnouncements(tenantId, {
        hostelId: getHostelId(req),
        audience: req.query.audience,
        status: req.query.status,
        page: getPageValue(req.query.page, 1),
        limit: getPageValue(req.query.limit, 25),
      }),
    );
  }

  getAnnouncement(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.getAnnouncement(tenantId, req.params.id),
    );
  }

  createAnnouncement(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(
      req,
      res,
      () =>
        service.createAnnouncement(
          tenantId,
          req.body ?? {},
          getActorId(req),
        ),
      201,
    );
  }

  updateAnnouncement(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.updateAnnouncement(
        tenantId,
        req.params.id,
        req.body ?? {},
      ),
    );
  }

  publishAnnouncement(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.publishAnnouncement(tenantId, req.params.id),
    );
  }

  archiveAnnouncement(req: Request, res: Response) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return sendError(res, 400, 'Tenant context is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    return respond(req, res, () =>
      service.archiveAnnouncement(tenantId, req.params.id),
    );
  }
}
