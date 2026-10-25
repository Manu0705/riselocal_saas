import { prisma, Prisma } from '@saas/database';
import { randomBytes } from 'node:crypto';
import { hashPassword } from '../../auth/infrastructure/password.service';
import {
  getCurrentFeeBillingPeriod,
  getOneTimeFeePeriod,
  type HostelFeeFrequency,
} from '../application/hostel-fee-billing';

export type HostelRepository = {
  findHostels(tenantId: string): Promise<unknown[]>;
  findPublicHostelsByTenantSlug(slug: string): Promise<unknown[]>;
  createHostel(input: { tenantId: string; name: string }): Promise<unknown>;
    // Fees
  listFees(input: {
    tenantId: string;
    hostelId?: string;
    isActive?: boolean;
    type?: string;
    search?: string;
  }): Promise<unknown[]>;

  findFee(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createFee(input: {
    tenantId: string;
    hostelId: string;
    name: string;
    type:
      | 'MONTHLY'
      | 'ADMISSION'
      | 'SECURITY_DEPOSIT'
      | 'MESS'
      | 'ELECTRICITY'
      | 'MAINTENANCE'
      | 'OTHER';
    billingFrequency: HostelFeeFrequency;
    description?: string;
    amount: number;
    currency?: string;
  }): Promise<unknown>;

  updateFee(input: {
    tenantId: string;
    id: string;
    name?: string;
    type?:
      | 'MONTHLY'
      | 'ADMISSION'
      | 'SECURITY_DEPOSIT'
      | 'MESS'
      | 'ELECTRICITY'
      | 'MAINTENANCE'
      | 'OTHER';
    billingFrequency?: HostelFeeFrequency;
    description?: string | null;
    amount?: number;
    currency?: string;
    isActive?: boolean;
  }): Promise<unknown>;

  deactivateFee(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;

  // Fee Assignments
  listFeeAssignments(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    feeId?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;

  findFeeAssignment(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createFeeAssignment(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    feeId: string;
    amount: number;
    dueDate?: Date;
    periodStart?: Date;
    periodEnd?: Date;
  }): Promise<unknown>;

  updateFeeAssignment(input: {
    tenantId: string;
    id: string;
    amount?: number;
    dueDate?: Date | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    status?: 'ACTIVE' | 'WAIVED' | 'CANCELLED';
  }): Promise<unknown>;

  cancelFeeAssignment(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;
  // Invoices
  listInvoices(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;

  findInvoice(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createInvoice(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    invoiceNumber: string;
    issueDate?: Date;
    dueDate?: Date;
    discount?: number;
    notes?: string | null;
    feeAssignmentIds: string[];
  }): Promise<unknown>;

  updateInvoice(input: {
    tenantId: string;
    id: string;
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date | null;
    discount?: number;
    notes?: string | null;
  }): Promise<unknown>;

  issueInvoice(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;

  cancelInvoice(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;

  findRooms(input: {
    tenantId: string;
    hostelId: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    items: unknown[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  createRoom(input: {
    tenantId: string;
    hostelId: string;
    roomNumber: string;
    capacity: number;
    sharingType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'DORMITORY';
  }): Promise<unknown>;
  updateRoom(input: {
    tenantId: string;
    id: string;
    roomNumber?: string;
    capacity?: number;
    sharingType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'DORMITORY';
    status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';
    isActive?: boolean;
  }): Promise<unknown>;
  deleteRoom(input: { tenantId: string; id: string }): Promise<unknown>;
  findRoom(input: { tenantId: string; id: string }): Promise<unknown | null>;
  listVacancies(input: { tenantId: string; hostelId: string }): Promise<unknown[]>;
  vacancySummary(input: { tenantId: string; hostelId: string }): Promise<unknown>;
  reserveStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  allocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  deallocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  autoAllocateStudent(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  listStays(input: {
    tenantId: string;
    hostelId: string;
    status?: 'ACTIVE' | 'CHECKED_OUT';
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;
  allocationHistory(input: { tenantId: string; roomId: string }): Promise<unknown[]>;
  recentAllocationActivity(input: {
    tenantId: string;
    hostelId: string;
    limit?: number;
  }): Promise<unknown[]>;
  listStudents(input: {
    tenantId: string;
    hostelId?: string;
    roomId?: string;
    paymentStatus?: string;
    status?: string;
    search?: string;
    userId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;
  hostelDashboardSummary(input: {
    tenantId: string;
     hostelId?: string;
  }): Promise<{
    outstandingFees: number;
    paidPayments: number;
    paidPaymentCount: number;
    pendingPaymentCount: number;
  }>;
  findStudent(input: { tenantId: string; id: string; userId?: string }): Promise<unknown | null>;
  listHostelEnquiries(input: { tenantId: string; hostelId: string }): Promise<unknown[]>;
  convertHostelEnquiry(input: {
    tenantId: string;
    hostelId: string;
    leadId: string;
    name: string;
    email?: string;
    phone: string;
    dateOfBirth?: Date;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    admissionDate: Date;
    roomId?: string;
    bedId?: string;
    actorId?: string;
  }): Promise<unknown>;
  createStudent(input: {
    tenantId: string;
    hostelId: string;
    admissionRequestId: string;
    roomId?: string;
    bedId?: string;
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    admissionDate?: Date;
    actorId?: string;
    paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
    status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'ARCHIVED';
  }): Promise<unknown>;
  updateStudent(input: {
    tenantId: string;
    id: string;
    roomId?: string | null;
    name?: string;
    email?: string | null;
    phone?: string | null;
    dateOfBirth?: Date | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    emergencyRelation?: string | null;
    admissionDate?: Date;
    paymentStatus?: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
    status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'ARCHIVED';
  }): Promise<unknown>;
  findStaff(input: { tenantId: string; hostelId: string }): Promise<unknown[]>;
  findAvailableStaffUsers(tenantId: string): Promise<unknown[]>;
  deleteStaffAssignment(input: {
    tenantId: string;
    hostelId: string;
    assignmentId: string;
  }): Promise<{ count: number }>;
  updateStaffAssignment(input: {
  tenantId: string;
  hostelId: string;
  assignmentId: string;
  role: 'ADMIN' | 'STAFF';
}): Promise<unknown>;
  createStaffAssignment(input: {
    tenantId: string;
    hostelId: string;
    userId: string;
    role: 'ADMIN' | 'STAFF';
  }): Promise<unknown>;
  initiatePayment(input: {
    tenantId: string;
    studentId?: string;
    studentUserId?: string;
    amount: number;
  }): Promise<unknown>;
  listPayments(input: {
    tenantId: string;
    studentId?: string;
    studentUserId?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;
  findPayment(input: {
    tenantId: string;
    id: string;
    studentId?: string;
    studentUserId?: string;
  }): Promise<unknown | null>;
  submitPayment(input: {
    tenantId: string;
    id: string;
    studentId?: string;
    studentUserId?: string;
    utr: string;
    transactionReferenceId?: string;
    proofUrl?: string;
    idempotencyKey: string;
  }): Promise<unknown>;
  verifyPayment(input: {
    tenantId: string;
    id: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<unknown>;
  rejectPayment(input: {
    tenantId: string;
    id: string;
    actorId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<unknown>;
  listReceipts(input: {
  tenantId: string;
  studentId?: string;
  studentUserId?: string;
  paymentId?: string;
  search?: string;
  page: number;
  limit: number;
}): Promise<{ items: unknown[]; total: number }>;

findReceipt(input: {
  tenantId: string;
  id: string;
  studentUserId?: string;
}): Promise<unknown | null>;

// Reports
getFeeCollectionSummary(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
  }): Promise<{
    feeAssignmentCount: number;
    assignedAmount: number;
    invoiceCount: number;
    invoicedAmount: number;
    collectedAmount: number;
    paymentCount: number;
    receiptCount: number;
    outstandingAmount: number;
  }>;

  listStudentOutstandingReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    page: number;
    limit: number;
  }): Promise<{
    items: unknown[];
    total: number;
  }>;

  listInvoiceReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: unknown[];
    total: number;
  }>;

  listPaymentReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: unknown[];
    total: number;
  }>;

  listReceiptReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: unknown[];
    total: number;
  }>;

  // Reconciliation
  listPaymentReconciliation(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: unknown[];
    total: number;
  }>;


  // Deposit
  listDeposits(input: {
    tenantId: string;
    hostelId?: string;
    status?: string;
    depositType?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;

  findDeposit(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createDeposit(input: {
    tenantId: string;
    hostelId: string;
    depositType: 'SECURITY_DEPOSIT' | 'ADVANCE_RENT' | 'OTHER';
    studentId?: string;
    amount: number;
    currency?: string;
    depositDate?: Date;
    paymentMethod?: string;
    reference?: string;
    depositedBy?: string;
    notes?: string | null;
  }): Promise<unknown>;

  updateDeposit(input: {
    tenantId: string;
    id: string;
    depositType?: 'SECURITY_DEPOSIT' | 'ADVANCE_RENT' | 'OTHER';
    studentId?: string | null;
    amount?: number;
    currency?: string;
    depositDate?: Date;
    paymentMethod?: string;
    reference?: string | null;
    depositedBy?: string | null;
    notes?: string | null;
  }): Promise<unknown>;

  reconcileDeposit(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;

  cancelDeposit(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;

  // Ledger
  listLedgerEntries(input: {
    tenantId: string;
    hostelId?: string;
    type?: string;
    direction?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;

  findLedgerEntry(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createLedgerEntry(input: {
    tenantId: string;
    hostelId: string;
    entryDate?: Date;
    type: string;
    direction: string;
    amount: number;
    currency?: string;
    referenceType?: string;
    referenceId?: string;
    description?: string | null;
    createdBy?: string;
  }): Promise<unknown>;

  // Complaints
  listComplaints(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;

  findComplaint(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createComplaint(input: {
    tenantId: string;
    hostelId: string;
    studentId?: string;
    subject: string;
    description: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<unknown>;

  updateComplaint(input: {
    tenantId: string;
    id: string;
    subject?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string | null;
    resolution?: string | null;
    resolvedAt?: Date | null;
  }): Promise<unknown>;

  // Announcements
  listAnnouncements(input: {
    tenantId: string;
    hostelId?: string;
    audience?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;

  findAnnouncement(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown | null>;

  createAnnouncement(input: {
    tenantId: string;
    hostelId: string;
    title: string;
    message: string;
    audience?: string;
    publishAt?: Date | null;
    expiresAt?: Date | null;
    createdBy?: string;
  }): Promise<unknown>;

  updateAnnouncement(input: {
    tenantId: string;
    id: string;
    hostelId?: string;
    title?: string;
    message?: string;
    audience?: string;
    publishAt?: Date | null;
    expiresAt?: Date | null;
    status?: string;
  }): Promise<unknown>;

  publishAnnouncement(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;

  archiveAnnouncement(input: {
    tenantId: string;
    id: string;
  }): Promise<unknown>;
};

export class HostelPropertyPrismaRepository implements HostelRepository {
  private async applyFeeToStudent(
    tx: Prisma.TransactionClient,
    fee: {
      id: string;
      tenantId: string;
      hostelId: string;
      name: string;
      type:
        | 'MONTHLY'
        | 'ADMISSION'
        | 'SECURITY_DEPOSIT'
        | 'MESS'
        | 'ELECTRICITY'
        | 'MAINTENANCE'
        | 'OTHER';
      billingFrequency: HostelFeeFrequency;
      amount: Prisma.Decimal;
      createdAt: Date;
    },
    student: {
      id: string;
      tenantId: string;
      hostelId: string;
      status: string;
      admissionDate: Date;
      outstandingAmount: Prisma.Decimal;
    },
    issuedAt: Date,
  ) {
    if (
      student.status !== 'ACTIVE' ||
      student.admissionDate > issuedAt ||
      fee.type === 'SECURITY_DEPOSIT' ||
      fee.createdAt > issuedAt
    ) {
      return false;
    }

    const period =
      fee.billingFrequency === 'ONE_TIME'
        ? getOneTimeFeePeriod(fee.createdAt, issuedAt)
        : getCurrentFeeBillingPeriod(fee.billingFrequency, issuedAt);
    if (!period) return false;

    const billingKey = [
      student.id,
      fee.id,
      period.start.toISOString(),
    ].join(':');
    const billingLockKey = [
      student.id,
      fee.type,
      period.start.toISOString(),
    ].join(':');
    const periodEndExclusive = new Date(period.end.getTime() + 1);
    const currentPeriodAssignmentConditions: Prisma.HostelFeeAssignmentWhereInput[] = [
      { periodStart: period.start },
      {
        periodStart: null,
        assignedAt: { gte: period.start, lt: periodEndExclusive },
      },
      {
        periodStart: null,
        dueDate: { gte: period.start, lt: periodEndExclusive },
      },
    ];
    const currentPeriodAssignments =
      fee.billingFrequency === 'ONE_TIME'
        ? {}
        : { OR: currentPeriodAssignmentConditions };
    const overlappingPeriodAssignments =
      fee.billingFrequency === 'ONE_TIME'
        ? {}
        : {
            OR: [
              {
                periodStart: { not: null, lte: period.end },
                OR: [{ periodEnd: null }, { periodEnd: { gte: period.start } }],
              },
              ...currentPeriodAssignmentConditions,
            ],
          };

    // await tx.$executeRaw<Array<{ pg_advisory_xact_lock: null }>>`
    //   SELECT pg_advisory_xact_lock(hashtext(${student.tenantId}), hashtext(${billingLockKey}))
    // `;

    await tx.$queryRaw<Array<{ locked: number }>>`
      WITH advisory_lock AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(
          hashtext(${student.tenantId}),
          hashtext(${billingLockKey})
        )
      )
      SELECT 1::int AS locked
      FROM advisory_lock
    `;

    const alreadyGenerated = await tx.hostelFeeAssignment.findFirst({
      where: { tenantId: student.tenantId, billingKey },
      select: { id: true },
    });
    if (alreadyGenerated) return false;

    let assignment = await tx.hostelFeeAssignment.findFirst({
      where: {
        tenantId: student.tenantId,
        studentId: student.id,
        feeId: fee.id,
        status: 'ACTIVE',
        ...currentPeriodAssignments,
      },
    });

    if (!assignment && fee.billingFrequency !== 'ONE_TIME') {
      const overlappingAssignment = await tx.hostelFeeAssignment.findFirst({
        where: {
          tenantId: student.tenantId,
          studentId: student.id,
          feeId: fee.id,
          status: 'ACTIVE',
          ...overlappingPeriodAssignments,
        },
        select: { id: true },
      });
      if (overlappingAssignment) return false;
    }

    const priorCategoryCharge = await tx.hostelFeeAssignment.findFirst({
      where: {
        tenantId: student.tenantId,
        studentId: student.id,
        status: 'ACTIVE',
        ...overlappingPeriodAssignments,
        fee: {
          type: fee.type,
          ...(fee.billingFrequency === 'ONE_TIME'
            ? {}
            : { id: { not: fee.id } }),
        },
      },
      select: { id: true },
    });
    if (priorCategoryCharge) return false;

    let createdAssignment = false;
    if (assignment) {
      const existingInvoiceItem = await tx.hostelInvoiceItem.findFirst({
        where: {
          tenantId: student.tenantId,
          feeAssignmentId: assignment.id,
          invoice: { status: { not: 'CANCELLED' } },
        },
        select: { id: true },
      });
      if (existingInvoiceItem) {
        await tx.hostelFeeAssignment.update({
          where: { id: assignment.id },
          data: { billingKey },
        });
        return false;
      }

      assignment = await tx.hostelFeeAssignment.update({
        where: { id: assignment.id },
        data: {
          dueDate: period.dueDate,
          periodStart: period.start,
          periodEnd: period.end,
          billingKey,
        },
      });
    } else {
      assignment = await tx.hostelFeeAssignment.create({
        data: {
          tenantId: student.tenantId,
          hostelId: student.hostelId,
          studentId: student.id,
          feeId: fee.id,
          amount: fee.amount,
          dueDate: period.dueDate,
          periodStart: period.start,
          periodEnd: period.end,
          billingKey,
          status: 'ACTIVE',
        },
      });
      createdAssignment = true;
    }
    const chargeAmount = assignment.amount;

    const invoiceNumber =
      `AUTO-${period.start.toISOString().slice(0, 10)}-${fee.id}-${student.id}`;
    await tx.hostelInvoice.create({
      data: {
        tenantId: student.tenantId,
        hostelId: student.hostelId,
        studentId: student.id,
        invoiceNumber,
        issueDate: issuedAt,
        dueDate: period.dueDate,
        subtotal: chargeAmount,
        discount: new Prisma.Decimal(0),
        totalAmount: chargeAmount,
        paidAmount: new Prisma.Decimal(0),
        balanceAmount: chargeAmount,
        status: 'ISSUED',
        notes: `${fee.name} (${period.start.toISOString().slice(0, 10)} to ${period.end.toISOString().slice(0, 10)})`,
        items: {
          create: {
            feeAssignmentId: assignment.id,
            description: fee.name,
            amount: chargeAmount,
          },
        },
      },
    });

    if (createdAssignment) {
      const nextOutstanding = student.outstandingAmount.add(chargeAmount);
      await tx.student.update({
        where: { id: student.id },
        data: {
          outstandingAmount: nextOutstanding,
          paymentStatus: nextOutstanding.gt(0) ? 'DUE' : 'PAID',
        },
      });
      student.outstandingAmount = nextOutstanding;
    }
    return true;
  }

  private async applyActiveFeesToStudent(
    tx: Prisma.TransactionClient,
    studentId: string,
    tenantId: string,
    hostelId: string,
    issuedAt: Date,
  ) {
    const student = await tx.student.findFirst({
      where: {
        id: studentId,
        tenantId,
        hostelId,
        status: 'ACTIVE',
        admissionDate: { lte: issuedAt },
      },
    });
    if (!student) return 0;

    const fees = await tx.hostelFee.findMany({
      where: {
        tenantId,
        hostelId,
        isActive: true,
        createdAt: { lte: issuedAt },
        type: { not: 'SECURITY_DEPOSIT' },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    let generatedCount = 0;
    for (const fee of fees) {
      if (await this.applyFeeToStudent(tx, fee, student, issuedAt)) {
        generatedCount += 1;
      }
    }
    return generatedCount;
  }

  async generateCurrentFeeInvoices(issuedAt = new Date()) {
    const fees = await prisma.hostelFee.findMany({
      where: {
        isActive: true,
        createdAt: { lte: issuedAt },
        billingFrequency: { not: 'ONE_TIME' },
        type: { not: 'SECURITY_DEPOSIT' },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const hostels = new Map<string, { tenantId: string; hostelId: string }>();
    for (const fee of fees) {
      hostels.set(`${fee.tenantId}:${fee.hostelId}`, {
        tenantId: fee.tenantId,
        hostelId: fee.hostelId,
      });
    }

    let generatedCount = 0;
    for (const { tenantId, hostelId } of hostels.values()) {
      const students = await prisma.student.findMany({
        where: {
          tenantId,
          hostelId,
          status: 'ACTIVE',
          admissionDate: { lte: issuedAt },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      });

      for (const student of students) {
        generatedCount += await prisma.$transaction((tx) =>
          this.applyActiveFeesToStudent(
            tx,
            student.id,
            tenantId,
            hostelId,
            issuedAt,
          ),
          {
            maxWait: 5000,
            timeout: 15000,
          },
        );
      }
    }
    return generatedCount;
  }

  findHostels(tenantId: string) {
    return prisma.hostel.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findPublicHostelsByTenantSlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
      select: {
        hostels: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            name: 'asc',
          },
          select: {
            name: true,
            rooms: {
              where: {
                isActive: true,
                status: {
                  in: ['AVAILABLE', 'OCCUPIED'],
                },
                vacancyStatus: {
                  not: 'UNAVAILABLE',
                },
              },
              select: {
                sharingType: true,
                capacity: true,
                vacancyStatus: true,
              },
              orderBy: {
                sharingType: 'asc',
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return [];
    }

    return tenant.hostels.map((hostel) => ({
      name: hostel.name,
      rooms: hostel.rooms.map((room) => ({
        sharingType: room.sharingType,
        capacity: room.capacity,
        availability:
          room.vacancyStatus === 'VACANT'
            ? 'AVAILABLE'
            : room.vacancyStatus === 'PARTIALLY_OCCUPIED'
              ? 'LIMITED'
              : 'FULL',
      })),
    }));
  }

  createHostel(input: { tenantId: string; name: string }) {
    return prisma.hostel.create({
      data: {
        name: input.name,
        tenant: { connect: { id: input.tenantId } },
      },
    });
  }

  async listFees(input: {
    tenantId: string;
    hostelId?: string;
    isActive?: boolean;
    type?: string;
    search?: string;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.type ? { type: input.type as never } : {}),
      ...(input.search
        ? {
            OR: [
              {
                name: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    return prisma.hostelFee.findMany({
      where,
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });
  }

  async findFee(input: {
    tenantId: string;
    id: string;
  }) {
    return prisma.hostelFee.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          where: {
            tenantId: input.tenantId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
              },
            },
          },
        },
      },
    });
  }

  async createFee(input: {
    tenantId: string;
    hostelId: string;
    name: string;
    type:
      | 'MONTHLY'
      | 'ADMISSION'
      | 'SECURITY_DEPOSIT'
      | 'MESS'
      | 'ELECTRICITY'
      | 'MAINTENANCE'
      | 'OTHER';
    billingFrequency: HostelFeeFrequency;
    description?: string;
    amount: number;
    currency?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const hostel = await tx.hostel.findFirst({
        where: { id: input.hostelId, tenantId: input.tenantId },
        select: { id: true },
      });
      if (!hostel) throw new Error('Hostel not found');

      const categoryLockKey = `fee-category:${input.hostelId}:${input.type}`;
      await tx.$queryRaw<Array<{ pg_advisory_xact_lock: null }>>`
        SELECT pg_advisory_xact_lock(hashtext(${input.tenantId}), hashtext(${categoryLockKey}))
      `;

      await tx.hostelFee.updateMany({
        where: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          type: input.type,
          isActive: true,
        },
        data: { isActive: false },
      });

      const fee = await tx.hostelFee.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          name: input.name,
          type: input.type,
          billingFrequency: input.billingFrequency,
          description: input.description,
          amount: new Prisma.Decimal(input.amount),
          currency: input.currency ?? 'INR',
          isActive: true,
        },
        include: {
          hostel: { select: { id: true, name: true } },
        },
      });

      const issuedAt = new Date();
      const students = await tx.student.findMany({
        where: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          status: 'ACTIVE',
          admissionDate: { lte: issuedAt },
        },
        select: { id: true },
      });
      for (const student of students) {
        await this.applyActiveFeesToStudent(
          tx,
          student.id,
          input.tenantId,
          input.hostelId,
          issuedAt,
        );
      }

      return fee;
    }, { timeout: 60_000 });
  }

  async updateFee(input: {
    tenantId: string;
    id: string;
    name?: string;
    type?:
      | 'MONTHLY'
      | 'ADMISSION'
      | 'SECURITY_DEPOSIT'
      | 'MESS'
      | 'ELECTRICITY'
      | 'MAINTENANCE'
      | 'OTHER';
    billingFrequency?: HostelFeeFrequency;
    description?: string | null;
    amount?: number;
    currency?: string;
    isActive?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.hostelFee.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });
      if (!existing) throw new Error('Fee not found');

      if (input.isActive !== false && (input.isActive === true || input.type)) {
        const nextType = input.type ?? existing.type;
        const categoryLockKey = `fee-category:${existing.hostelId}:${nextType}`;
        await tx.$queryRaw<Array<{ pg_advisory_xact_lock: null }>>`
          SELECT pg_advisory_xact_lock(hashtext(${input.tenantId}), hashtext(${categoryLockKey}))
        `;
        await tx.hostelFee.updateMany({
          where: {
            tenantId: input.tenantId,
            hostelId: existing.hostelId,
            type: nextType,
            id: { not: existing.id },
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      const fee = await tx.hostelFee.update({
        where: { id: existing.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.billingFrequency !== undefined
            ? { billingFrequency: input.billingFrequency }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.amount !== undefined
            ? { amount: new Prisma.Decimal(input.amount) }
            : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: {
          hostel: { select: { id: true, name: true } },
        },
      });

      if (fee.isActive) {
        const issuedAt = new Date();
        const students = await tx.student.findMany({
          where: {
            tenantId: fee.tenantId,
            hostelId: fee.hostelId,
            status: 'ACTIVE',
            admissionDate: { lte: issuedAt },
          },
          select: { id: true },
        });
        for (const student of students) {
          await this.applyActiveFeesToStudent(
            tx,
            student.id,
            fee.tenantId,
            fee.hostelId,
            issuedAt,
          );
        }
      }

      return fee;
    });
  }

  async deactivateFee(input: {
    tenantId: string;
    id: string;
  }) {
    const existing = await prisma.hostelFee.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!existing) throw new Error('Fee not found');

    return prisma.hostelFee.update({
      where: {
        id: existing.id,
      },
      data: {
        isActive: false,
      },
    });
  }

    async listFeeAssignments(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    feeId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.feeId ? { feeId: input.feeId } : {}),
      ...(input.status
        ? { status: input.status as never }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelFeeAssignment.findMany({
        where,
        include: {
          fee: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              admissionNumber: true,
            },
          },
          hostel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          assignedAt: 'desc',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.hostelFeeAssignment.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findFeeAssignment(input: {
    tenantId: string;
    id: string;
  }) {
    return prisma.hostelFeeAssignment.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
      include: {
        fee: true,
        student: {
          select: {
            id: true,
            name: true,
            admissionNumber: true,
            outstandingAmount: true,
            paymentStatus: true,
          },
        },
        hostel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async createFeeAssignment(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    feeId: string;
    amount: number;
    dueDate?: Date;
    periodStart?: Date;
    periodEnd?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const [student, fee] = await Promise.all([
        tx.student.findFirst({
          where: {
            id: input.studentId,
            tenantId: input.tenantId,
            hostelId: input.hostelId,
          },
          select: {
            id: true,
            outstandingAmount: true,
            paymentStatus: true,
          },
        }),

        tx.hostelFee.findFirst({
          where: {
            id: input.feeId,
            tenantId: input.tenantId,
            hostelId: input.hostelId,
            isActive: true,
          },
          select: {
            id: true,
            amount: true,
            type: true,
          },
        }),
      ]);

      if (!student) throw new Error('Student not found');
      if (!fee) throw new Error('Active fee not found');
      if (fee.type === 'SECURITY_DEPOSIT') {
        throw new Error('Security deposits must be recorded through the deposits workflow');
      }

      const amount = new Prisma.Decimal(input.amount);

      if (amount.lte(0)) {
        throw new Error('Fee assignment amount must be positive');
      }

      const assignment = await tx.hostelFeeAssignment.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          studentId: input.studentId,
          feeId: input.feeId,
          amount,
          dueDate: input.dueDate,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          status: 'ACTIVE',
        },
        include: {
          fee: true,
          student: {
            select: {
              id: true,
              name: true,
              admissionNumber: true,
              outstandingAmount: true,
              paymentStatus: true,
            },
          },
        },
      });

      const outstandingAmount =
        student.outstandingAmount.add(amount);

      await tx.student.update({
        where: {
          id: student.id,
        },
        data: {
          outstandingAmount,
          paymentStatus:
            outstandingAmount.gt(0)
              ? 'DUE'
              : 'PAID',
        },
      });

      return assignment;
    });
  }

  async updateFeeAssignment(input: {
    tenantId: string;
    id: string;
    amount?: number;
    dueDate?: Date | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    status?: 'ACTIVE' | 'WAIVED' | 'CANCELLED';
  }) {
    return prisma.$transaction(async (tx) => {
      const existing =
        await tx.hostelFeeAssignment.findFirst({
          where: {
            id: input.id,
            tenantId: input.tenantId,
          },
        });

      if (!existing) {
        throw new Error('Fee assignment not found');
      }

      if (
        input.status !== undefined &&
        existing.status !== 'ACTIVE' &&
        input.status !== existing.status
      ) {
        throw new Error(
          'Only active fee assignments can change status',
        );
      }

      const oldAmount = existing.amount;

      const newAmount =
        input.amount !== undefined
          ? new Prisma.Decimal(input.amount)
          : oldAmount;

      if (newAmount.lte(0)) {
        throw new Error(
          'Fee assignment amount must be positive',
        );
      }

      const nextStatus =
        input.status ?? existing.status;

      const updated =
        await tx.hostelFeeAssignment.update({
          where: {
            id: existing.id,
          },
          data: {
            ...(input.amount !== undefined
              ? { amount: newAmount }
              : {}),
            ...(input.dueDate !== undefined
              ? { dueDate: input.dueDate }
              : {}),
            ...(input.periodStart !== undefined
              ? { periodStart: input.periodStart }
              : {}),
            ...(input.periodEnd !== undefined
              ? { periodEnd: input.periodEnd }
              : {}),
            ...(input.status !== undefined
              ? { status: input.status }
              : {}),
          },
          include: {
            fee: true,
            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
                outstandingAmount: true,
                paymentStatus: true,
              },
            },
          },
        });

      // Adjust the student's outstanding balance according
      // to the old active amount vs the new active amount.
      const oldDue =
        existing.status === 'ACTIVE'
          ? oldAmount
          : new Prisma.Decimal(0);

      const newDue =
        nextStatus === 'ACTIVE'
          ? newAmount
          : new Prisma.Decimal(0);

      const netChange =
        newDue.sub(oldDue);

      if (!netChange.isZero()) {
        const student =
          await tx.student.findFirst({
            where: {
              id: existing.studentId,
              tenantId: existing.tenantId,
            },
            select: {
              id: true,
              outstandingAmount: true,
            },
          });

        if (!student) {
          throw new Error('Student not found');
        }

        const outstandingAmount =
          student.outstandingAmount.add(netChange);

        if (outstandingAmount.lt(0)) {
          throw new Error(
            'Fee assignment adjustment exceeds outstanding balance',
          );
        }

        await tx.student.update({
          where: {
            id: student.id,
          },
          data: {
            outstandingAmount,
            paymentStatus:
              outstandingAmount.gt(0)
                ? 'DUE'
                : 'PAID',
          },
        });
      }

      return updated;
    });
  }

  async cancelFeeAssignment(input: {
    tenantId: string;
    id: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const assignment =
        await tx.hostelFeeAssignment.findFirst({
          where: {
            id: input.id,
            tenantId: input.tenantId,
          },
        });

      if (!assignment) {
        throw new Error('Fee assignment not found');
      }

      if (assignment.status === 'CANCELLED') {
        return assignment;
      }

      if (assignment.status === 'WAIVED') {
        return assignment;
      }

      const student =
        await tx.student.findFirst({
          where: {
            id: assignment.studentId,
            tenantId: assignment.tenantId,
          },
          select: {
            id: true,
            outstandingAmount: true,
          },
        });

      if (!student) {
        throw new Error('Student not found');
      }

      const outstandingAmount =
        student.outstandingAmount.sub(
          assignment.amount,
        );

      if (outstandingAmount.lt(0)) {
        throw new Error(
          'Cannot cancel assignment because the outstanding balance is already lower than the assignment amount',
        );
      }

      const updated =
        await tx.hostelFeeAssignment.update({
          where: {
            id: assignment.id,
          },
          data: {
            status: 'CANCELLED',
          },
        });

      await tx.student.update({
        where: {
          id: student.id,
        },
        data: {
          outstandingAmount,
          paymentStatus:
            outstandingAmount.gt(0)
              ? 'DUE'
              : 'PAID',
        },
      });

      return updated;
    });
  }

  // ---------------------------------------------------------------------------
  // Invoices
  // ---------------------------------------------------------------------------

  async listInvoices(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.search
        ? {
            OR: [
              { invoiceNumber: { contains: input.search, mode: 'insensitive' as const } },
              { student: { name: { contains: input.search, mode: 'insensitive' as const } } },
              { student: { admissionNumber: { contains: input.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelInvoice.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, admissionNumber: true } },
          hostel: { select: { id: true, name: true } },
          _count: { select: { items: true, payments: true } },
        },
        orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.hostelInvoice.count({ where }),
    ]);

    return { items, total };
  }

  async findInvoice(input: { tenantId: string; id: string }) {
    return prisma.hostelInvoice.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNumber: true,
            outstandingAmount: true,
            paymentStatus: true,
          },
        },
        hostel: { select: { id: true, name: true } },
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            feeAssignment: {
              include: {
                fee: { select: { id: true, name: true, type: true, currency: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { allocatedAt: 'desc' },
          include: { payment: { include: { receipt: true } } },
        },
      },
    });
  }

  async createInvoice(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    invoiceNumber: string;
    issueDate?: Date;
    dueDate?: Date;
    discount?: number;
    notes?: string | null;
    feeAssignmentIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      const [hostel, student] = await Promise.all([
        tx.hostel.findFirst({
          where: { id: input.hostelId, tenantId: input.tenantId },
          select: { id: true },
        }),
        tx.student.findFirst({
          where: { id: input.studentId, tenantId: input.tenantId, hostelId: input.hostelId },
          select: { id: true },
        }),
      ]);

      if (!hostel) throw new Error('Hostel not found');
      if (!student) throw new Error('Student not found');

      const feeAssignmentIds = Array.from(new Set(input.feeAssignmentIds));
      if (feeAssignmentIds.length === 0) {
        throw new Error('At least one fee assignment is required');
      }

      const assignments = await tx.hostelFeeAssignment.findMany({
        where: {
          id: { in: feeAssignmentIds },
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          studentId: input.studentId,
          status: 'ACTIVE',
        },
        include: {
          fee: { select: { id: true, name: true, type: true, currency: true } },
        },
      });

      if (assignments.length !== feeAssignmentIds.length) {
        throw new Error('One or more fee assignments are invalid, inactive, or belong to another student');
      }

      const alreadyInvoiced = await tx.hostelInvoiceItem.findFirst({
        where: {
          tenantId: input.tenantId,
          feeAssignmentId: { in: feeAssignmentIds },
          invoice: { status: { not: 'CANCELLED' } },
        },
        select: { feeAssignmentId: true },
      });

      if (alreadyInvoiced) {
        throw new Error('One or more fee assignments are already included in an active invoice');
      }

      const subtotal = assignments.reduce(
        (sum, assignment) => sum.add(assignment.amount),
        new Prisma.Decimal(0),
      );
      const discount = new Prisma.Decimal(input.discount ?? 0);

      if (discount.lt(0)) throw new Error('Invoice discount cannot be negative');
      if (discount.gt(subtotal)) throw new Error('Invoice discount cannot exceed subtotal');

      const totalAmount = subtotal.sub(discount);
      if (totalAmount.lte(0)) throw new Error('Invoice total must be positive');

      return tx.hostelInvoice.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          studentId: input.studentId,
          invoiceNumber: input.invoiceNumber,
          issueDate: input.issueDate ?? new Date(),
          dueDate: input.dueDate,
          subtotal,
          discount,
          totalAmount,
          paidAmount: new Prisma.Decimal(0),
          balanceAmount: totalAmount,
          status: 'DRAFT',
          notes: input.notes,
          items: {
            create: assignments.map((assignment) => ({
              tenantId: input.tenantId,
              feeAssignmentId: assignment.id,
              description: assignment.fee.name,
              amount: assignment.amount,
            })),
          },
        },
        include: {
          student: { select: { id: true, name: true, admissionNumber: true } },
          hostel: { select: { id: true, name: true } },
          items: true,
        },
      });
    });
  }

  async updateInvoice(input: {
    tenantId: string;
    id: string;
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date | null;
    discount?: number;
    notes?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.hostelInvoice.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
        include: { items: { select: { amount: true } } },
      });

      if (!existing) throw new Error('Invoice not found');
      if (existing.status !== 'DRAFT') throw new Error('Only draft invoices can be updated');

      const subtotal = existing.items.reduce(
        (sum, item) => sum.add(item.amount),
        new Prisma.Decimal(0),
      );
      const discount =
        input.discount !== undefined
          ? new Prisma.Decimal(input.discount)
          : existing.discount;

      if (discount.lt(0)) throw new Error('Invoice discount cannot be negative');
      if (discount.gt(subtotal)) throw new Error('Invoice discount cannot exceed subtotal');

      const totalAmount = subtotal.sub(discount);
      if (totalAmount.lte(0)) throw new Error('Invoice total must be positive');

      return tx.hostelInvoice.update({
        where: { id: existing.id },
        data: {
          ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber } : {}),
          ...(input.issueDate !== undefined ? { issueDate: input.issueDate } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.discount !== undefined ? { discount } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          subtotal,
          totalAmount,
          balanceAmount: totalAmount.sub(existing.paidAmount),
        },
        include: {
          student: { select: { id: true, name: true, admissionNumber: true } },
          hostel: { select: { id: true, name: true } },
          items: true,
        },
      });
    });
  }

  async issueInvoice(input: { tenantId: string; id: string }) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.hostelInvoice.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status !== 'DRAFT') throw new Error('Only draft invoices can be issued');
      if (invoice.totalAmount.lte(0)) throw new Error('Invoice total must be positive');

      return tx.hostelInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'ISSUED',
          balanceAmount: invoice.totalAmount.sub(invoice.paidAmount),
        },
        include: {
          student: { select: { id: true, name: true, admissionNumber: true } },
          hostel: { select: { id: true, name: true } },
          items: true,
        },
      });
    });
  }

  async cancelInvoice(input: { tenantId: string; id: string }) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.hostelInvoice.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'CANCELLED') return invoice;
      if (invoice.status === 'PAID' || invoice.paidAmount.gt(0)) {
        throw new Error('Paid or partially paid invoices cannot be cancelled');
      }

      return tx.hostelInvoice.update({
        where: { id: invoice.id },
        data: { status: 'CANCELLED', balanceAmount: new Prisma.Decimal(0) },
      });
    });
  }

  async findRooms(input: {
    tenantId: string;
    hostelId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 25;
    const skip = (page - 1) * limit;

    const search = input.search?.trim();

    const where = {
      tenantId: input.tenantId,
      hostelId: input.hostelId,
      ...(search
        ? {
            roomNumber: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.room.findMany({
        where,
        orderBy: { roomNumber: 'asc' },
        skip,
        take: limit,
        include: {
          students: {
            where: { tenantId: input.tenantId },
            select: { id: true, name: true, admissionNumber: true },
          },
          beds: {
            where: { status: { not: 'INACTIVE' } },
            orderBy: { bedNumber: 'asc' },
            include: {
              student: { select: { id: true, name: true, admissionNumber: true } },
            },
          },
        },
      }),

      prisma.room.count({
        where,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createRoom(input: {
    tenantId: string;
    hostelId: string;
    roomNumber: string;
    capacity: number;
    sharingType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'DORMITORY';
  }) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          roomNumber: input.roomNumber,
          capacity: input.capacity,
          ...(input.sharingType ? { sharingType: input.sharingType } : {}),
          tenant: { connect: { id: input.tenantId } },
          hostel: {
            connect: { id_tenantId: { id: input.hostelId, tenantId: input.tenantId } },
          },
        },
      });

      await tx.roomBed.createMany({
        data: Array.from({ length: input.capacity }, (_, index) => ({
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: room.id,
          bedNumber: `B${index + 1}`,
        })),
      });

      return tx.room.findUnique({
        where: { id: room.id },
        include: { beds: { orderBy: { bedNumber: 'asc' } } },
      });
    });
  }

  findRoom(input: { tenantId: string; id: string }) {
    return prisma.room.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
      include: {
        hostel: { select: { id: true, name: true } },
        students: {
          where: { tenantId: input.tenantId },
          select: { id: true, name: true, admissionNumber: true },
        },
        beds: {
          where: { status: { not: 'INACTIVE' } },
          orderBy: { bedNumber: 'asc' },
          include: { student: { select: { id: true, name: true, admissionNumber: true } } },
        },
      },
    });
  }

  updateRoom(input: {
    tenantId: string;
    id: string;
    roomNumber?: string;
    capacity?: number;
    sharingType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'DORMITORY';
    status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';
    isActive?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.findFirst({ where: { id: input.id, tenantId: input.tenantId } });
      if (!room) throw new Error('Room not found');
      if (input.capacity !== undefined && input.capacity < room.occupancy) {
        throw new Error('Capacity cannot be below current occupancy');
      }
      const capacity = input.capacity ?? room.capacity;
      const beds = await tx.roomBed.findMany({
        where: { tenantId: input.tenantId, roomId: room.id },
        orderBy: { bedNumber: 'desc' },
      });
      const activeBeds = beds.filter((bed) => bed.status !== 'INACTIVE');

      if (capacity < activeBeds.length) {
        const toRetire = activeBeds.slice(0, activeBeds.length - capacity);
        if (toRetire.some((bed) => bed.status !== 'AVAILABLE')) {
          throw new Error('Capacity cannot be reduced while beds are reserved or occupied');
        }
        await tx.roomBed.updateMany({
          where: { id: { in: toRetire.map((bed) => bed.id) }, tenantId: input.tenantId },
          data: { status: 'INACTIVE' },
        });
      } else if (capacity > activeBeds.length) {
        const needed = capacity - activeBeds.length;
        const inactiveBeds = beds.filter((bed) => bed.status === 'INACTIVE').slice(0, needed);
        if (inactiveBeds.length > 0) {
          await tx.roomBed.updateMany({
            where: { id: { in: inactiveBeds.map((bed) => bed.id) }, tenantId: input.tenantId },
            data: { status: 'AVAILABLE' },
          });
        }
        const remaining = needed - inactiveBeds.length;
        if (remaining > 0) {
          const highestBedNumber = beds.reduce((highest, bed) => {
            const number = Number(bed.bedNumber.replace(/^B/, ''));
            return Number.isInteger(number) ? Math.max(highest, number) : highest;
          }, 0);
          await tx.roomBed.createMany({
            data: Array.from({ length: remaining }, (_, index) => ({
              tenantId: input.tenantId,
              hostelId: room.hostelId,
              roomId: room.id,
              bedNumber: `B${highestBedNumber + index + 1}`,
            })),
          });
        }
      }
      const status = input.status ?? room.status;
      const isActive = input.isActive ?? room.isActive;
      const vacancyStatus =
        !isActive || status === 'INACTIVE' || status === 'MAINTENANCE'
          ? 'UNAVAILABLE'
          : room.occupancy === 0
            ? 'VACANT'
            : room.occupancy >= capacity
              ? 'FULL'
              : 'PARTIALLY_OCCUPIED';

      const {
        tenantId: _tenantId,
        id: _id,
        ...roomData
      } = input;

      await tx.room.update({
        where: { id: input.id },
        data: {
          ...roomData,
          vacancyStatus,
        },
      });
      await this.syncRoomBedState(tx, input.tenantId, room.id);
      return tx.room.findUnique({
        where: { id: room.id },
        include: { beds: { where: { status: { not: 'INACTIVE' } }, orderBy: { bedNumber: 'asc' } } },
      });
    });
  }

  async deleteRoom(input: { tenantId: string; id: string }) {
    const room = await prisma.room.findFirst({ where: { id: input.id, tenantId: input.tenantId } });
    if (!room) throw new Error('Room not found');
    const assignedBeds = await prisma.roomBed.count({
      where: { tenantId: input.tenantId, roomId: room.id, status: { in: ['RESERVED', 'OCCUPIED'] } },
    });
    if (assignedBeds > 0 || room.occupancy > 0) {
      throw new Error('Cannot deactivate a room with reserved or occupied beds');
    }

    return prisma.room.update({
      where: { id: input.id },
      data: { isActive: false, status: 'INACTIVE', vacancyStatus: 'UNAVAILABLE' },
    });
  }

  async listVacancies(input: { tenantId: string; hostelId: string }) {
    return prisma.room.findMany({
      where: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        isActive: true,
        vacancyStatus: { not: 'UNAVAILABLE' },
      },
      orderBy: [{ vacancyStatus: 'asc' }, { roomNumber: 'asc' }],
      include: {
        beds: {
          where: { status: { not: 'INACTIVE' } },
          orderBy: { bedNumber: 'asc' },
          include: { student: { select: { id: true, name: true, admissionNumber: true } } },
        },
      },
    });
  }

  async vacancySummary(input: { tenantId: string; hostelId: string }) {
    const rooms = await prisma.room.findMany({
      where: input,
      include: { beds: { where: { status: { not: 'INACTIVE' } }, select: { status: true } } },
    });
    return rooms.reduce(
      (summary, room) => {
        summary.rooms += 1;
        summary.capacity += room.capacity;
        const occupied = room.beds.filter((bed) => bed.status === 'OCCUPIED').length;
        const reserved = room.beds.filter((bed) => bed.status === 'RESERVED').length;
        const available = room.beds.filter((bed) => bed.status === 'AVAILABLE').length;
        summary.occupancy += occupied;
        summary.reserved += reserved;
        summary.vacancy += available;
        if (available === 0) summary.full += 1;
        if (occupied === 0 && reserved === 0) summary.vacant += 1;
        if (available > 0 && (occupied > 0 || reserved > 0)) summary.partial += 1;
        return summary;
      },
      { rooms: 0, capacity: 0, occupancy: 0, reserved: 0, vacancy: 0, full: 0, vacant: 0, partial: 0 },
    );
  }

  private async withAllocationRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    timeout = 15_000,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(operation, {
          isolationLevel: 'Serializable',
          timeout,
        });
      } catch (error: unknown) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        if (code !== 'P2034' || attempt === 2) throw error;
      }
    }
    throw new Error('Allocation transaction failed');
  }

  private async syncRoomBedState(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roomId: string,
  ) {
    const beds = await tx.roomBed.findMany({
      where: { tenantId, roomId, status: { not: 'INACTIVE' } },
      select: { status: true },
    });
    const occupied = beds.filter((bed) => bed.status === 'OCCUPIED').length;
    const reserved = beds.filter((bed) => bed.status === 'RESERVED').length;
    const available = beds.filter((bed) => bed.status === 'AVAILABLE').length;
    const room = await tx.room.findFirst({ where: { id: roomId, tenantId } });

    if (!room) throw new Error('Room not found');

    const unavailable = !room.isActive || room.status === 'MAINTENANCE' || room.status === 'INACTIVE';
    await tx.room.update({
      where: { id: room.id },
      data: {
        occupancy: occupied,
        vacancyStatus: unavailable
          ? 'UNAVAILABLE'
          : available === 0
            ? 'FULL'
            : occupied === 0 && reserved === 0
              ? 'VACANT'
              : 'PARTIALLY_OCCUPIED',
      },
    });
  }

  reserveStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    studentId: string;
    actorId?: string;
  }) {
    return this.withAllocationRetry(async (tx) => {
      const room = await tx.room.findFirst({
        where: { id: input.roomId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!room) throw new Error('Room not found');
      if (!room.isActive || room.status === 'MAINTENANCE' || room.status === 'INACTIVE') {
        throw new Error('Room is unavailable');
      }

      const student = await tx.student.findFirst({
        where: { id: input.studentId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!student) throw new Error('Student not found');
      if (student.status !== 'ACTIVE') throw new Error('Only active students can reserve a bed');
      if (student.roomId) throw new Error('Student is already allocated');

      const existingBed = await tx.roomBed.findFirst({
        where: { tenantId: input.tenantId, studentId: input.studentId },
      });
      if (existingBed) throw new Error('Student already has an active bed assignment');

      const bed = await tx.roomBed.findFirst({
        where: {
          id: input.bedId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          status: 'AVAILABLE',
          studentId: null,
        },
      });
      if (!bed) throw new Error('Bed is unavailable');

      const reserved = await tx.roomBed.updateMany({
        where: { id: bed.id, tenantId: input.tenantId, status: 'AVAILABLE', studentId: null },
        data: { status: 'RESERVED', studentId: input.studentId },
      });
      if (reserved.count !== 1) throw new Error('Bed is unavailable');

      await tx.roomAllocation.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          bedId: bed.id,
          studentId: input.studentId,
          actorId: input.actorId,
          action: 'RESERVED',
        },
      });
      await this.syncRoomBedState(tx, input.tenantId, input.roomId);

      return tx.roomBed.findUnique({
        where: { id: bed.id },
        include: { student: { select: { id: true, name: true, admissionNumber: true } } },
      });
    });
  }

  allocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    studentId: string;
    actorId?: string;
  }) {
    return this.withAllocationRetry(async (tx) => {
      const room = await tx.room.findFirst({
        where: { id: input.roomId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!room) throw new Error('Room not found');
      if (!room.isActive || room.status === 'MAINTENANCE' || room.status === 'INACTIVE')
        throw new Error('Room is unavailable');

      const student = await tx.student.findFirst({
        where: { id: input.studentId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!student) throw new Error('Student not found');
      if (student.status !== 'ACTIVE') throw new Error('Only active students can check in');

      const activeStay = await tx.hostelStay.findFirst({
        where: { tenantId: input.tenantId, studentId: student.id, status: 'ACTIVE' },
      });

      const bed = await tx.roomBed.findFirst({
        where: {
          id: input.bedId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
        },
      });
      if (!bed) throw new Error('Bed not found');

      if (student.roomId || activeStay) {
        const sameActiveAllocation =
          student.roomId === input.roomId &&
          activeStay?.hostelId === input.hostelId &&
          activeStay.roomId === input.roomId &&
          activeStay.bedId === input.bedId &&
          bed.status === 'OCCUPIED' &&
          bed.studentId === input.studentId;

        if (sameActiveAllocation && activeStay) {
          const allocation = await tx.roomAllocation.findFirst({
            where: {
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              roomId: input.roomId,
              bedId: input.bedId,
              studentId: input.studentId,
              action: 'ALLOCATED',
            },
            orderBy: { happenedAt: 'desc' },
          });
          if (allocation) return { allocation, stay: activeStay };
        }

        throw new Error(
          activeStay ? 'Student already has an active stay' : 'Student is already allocated',
        );
      }

      if (bed.status === 'OCCUPIED' || bed.status === 'INACTIVE') {
        throw new Error('Bed is unavailable');
      }
      if (bed.status === 'RESERVED' && bed.studentId !== input.studentId) {
        throw new Error('Bed is reserved for another student');
      }

      const existingBed = await tx.roomBed.findFirst({
        where: { tenantId: input.tenantId, studentId: input.studentId, id: { not: bed.id } },
      });
      if (existingBed) throw new Error('Student already has an active bed assignment');

      const bedUpdate = await tx.roomBed.updateMany({
        where: {
          id: bed.id,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          OR: [
            { status: 'AVAILABLE', studentId: null },
            { status: 'RESERVED', studentId: input.studentId },
          ],
        },
        data: { status: 'OCCUPIED', studentId: input.studentId },
      });
      if (bedUpdate.count !== 1) throw new Error('Bed is unavailable');

      const studentUpdate = await tx.student.updateMany({
        where: {
          id: input.studentId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: null,
        },
        data: { roomId: input.roomId },
      });
      if (studentUpdate.count !== 1) throw new Error('Student is already allocated');
      const allocation = await tx.roomAllocation.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          bedId: bed.id,
          studentId: input.studentId,
          actorId: input.actorId,
          action: 'ALLOCATED',
        },
      });
      const stay = await tx.hostelStay.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          bedId: bed.id,
          studentId: student.id,
          status: 'ACTIVE',
        },
      });
      await this.syncRoomBedState(tx, input.tenantId, input.roomId);
      return { allocation, stay };
    });
  }

  deallocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    studentId: string;
    actorId?: string;
  }) {
    return this.withAllocationRetry(async (tx) => {
      const room = await tx.room.findFirst({
        where: { id: input.roomId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!room) throw new Error('Room not found');
      const stay = await tx.hostelStay.findFirst({
        where: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          bedId: input.bedId,
          studentId: input.studentId,
          status: 'ACTIVE',
        },
      });
      if (!stay) throw new Error('Student has no active stay in this bed');

      const bed = await tx.roomBed.findFirst({
        where: {
          id: input.bedId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          studentId: input.studentId,
          status: 'OCCUPIED',
        },
      });
      if (!bed) throw new Error('Student does not occupy this bed');

      const studentUpdate = await tx.student.updateMany({
        where: {
          id: input.studentId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
        },
        data: { roomId: null },
      });
      if (studentUpdate.count !== 1) throw new Error('Student room assignment is inconsistent');

      const checkedOutAt = new Date();
      const closedStay = await tx.hostelStay.updateMany({
        where: { id: stay.id, tenantId: input.tenantId, status: 'ACTIVE' },
        data: { status: 'CHECKED_OUT', checkedOutAt },
      });
      if (closedStay.count !== 1) throw new Error('Stay is no longer active');

      await tx.roomBed.update({
        where: { id: bed.id },
        data: { status: 'AVAILABLE', studentId: null },
      });
      const allocation = await tx.roomAllocation.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          bedId: bed.id,
          studentId: input.studentId,
          actorId: input.actorId,
          action: 'DEALLOCATED',
        },
      });
      await this.syncRoomBedState(tx, input.tenantId, input.roomId);
      const completedStay = await tx.hostelStay.findUnique({ where: { id: stay.id } });
      return { allocation, stay: completedStay };
    });
  }

  async listStays(input: {
    tenantId: string;
    hostelId: string;
    status?: 'ACTIVE' | 'CHECKED_OUT';
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      hostelId: input.hostelId,
      ...(input.status ? { status: input.status } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.hostelStay.findMany({
        where,
        orderBy: [{ checkedInAt: 'desc' }, { createdAt: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          student: { select: { id: true, name: true, admissionNumber: true } },
          room: { select: { id: true, roomNumber: true } },
          bed: { select: { id: true, bedNumber: true } },
        },
      }),
      prisma.hostelStay.count({ where }),
    ]);
    return { items, total };
  }

  async autoAllocateStudent(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    actorId?: string;
  }) {
    const beds = await prisma.roomBed.findMany({
      where: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        status: 'AVAILABLE',
        room: { isActive: true, status: { notIn: ['MAINTENANCE', 'INACTIVE'] } },
      },
      orderBy: [{ roomId: 'asc' }, { bedNumber: 'asc' }],
      select: { id: true, roomId: true },
    });
    for (const bed of beds) {
      try {
        return await this.allocateStudent({ ...input, roomId: bed.roomId, bedId: bed.id });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (!/full|unavailable|already allocated/i.test(message)) throw error;
      }
    }
    throw new Error('No available room');
  }

  allocationHistory(input: { tenantId: string; roomId: string }) {
    return prisma.roomAllocation.findMany({ where: input, orderBy: { happenedAt: 'desc' } });
  }

  async recentAllocationActivity(input: {
    tenantId: string;
    hostelId: string;
    limit?: number;
  }) {
    const limit = Math.min(20, Math.max(1, input.limit ?? 10));

    return prisma.roomAllocation.findMany({
      where: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
      },
      orderBy: {
        happenedAt: 'desc',
      },
      take: limit,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            admissionNumber: true,
          },
        },
      },
    });
  }

  async listStudents(input: {
    tenantId: string;
    hostelId?: string;
    roomId?: string;
    paymentStatus?: string;
    status?: string;
    search?: string;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.roomId ? { roomId: input.roomId } : {}),
      ...(input.paymentStatus ? { paymentStatus: input.paymentStatus as never } : {}),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.userId
        ? {
            studentAccount: {
              id: input.userId,
            },
          }
        : {}),
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' as const } },
              { admissionNumber: { contains: input.search, mode: 'insensitive' as const } },
              { email: { contains: input.search, mode: 'insensitive' as const } },
              { phone: { contains: input.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          hostel: { select: { id: true, name: true } },
          room: { select: { id: true, roomNumber: true } },
        },
        orderBy: { name: 'asc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.student.count({ where }),
    ]);

    return { items, total };
  }

  async hostelDashboardSummary(input: {
    tenantId: string;
    hostelId?: string;
  }) {
    const studentWhere = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
    };

    const paymentWhere = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { student: { hostelId: input.hostelId } } : {}),
    };

    const [outstanding, paidPayments, pendingPaymentCount] = await prisma.$transaction([
      prisma.student.aggregate({
        where: studentWhere,
        _sum: {
          outstandingAmount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          ...paymentWhere,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.payment.count({
        where: {
          ...paymentWhere,
          status: {
            in: ['INITIATED', 'PENDING', 'SUBMITTED', 'VERIFYING'],
          },
        },
      }),
    ]);

    return {
      outstandingFees: outstanding._sum.outstandingAmount?.toNumber() ?? 0,
      paidPayments: paidPayments._sum.amount?.toNumber() ?? 0,
      paidPaymentCount: paidPayments._count._all,
      pendingPaymentCount,
    };
  }

  findStudent(input: { tenantId: string; id: string; userId?: string }) {
    return prisma.student.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        ...(input.userId
          ? {
              studentAccount: {
                id: input.userId,
              },
            }
          : {}),
      },
      include: {
        hostel: { select: { id: true, name: true } },
        room: { select: { id: true, roomNumber: true } },
        beds: {
          where: { status: { in: ['RESERVED', 'OCCUPIED'] } },
          select: { id: true, roomId: true, status: true, bedNumber: true },
        },
      },
    });
  }

  listHostelEnquiries(input: { tenantId: string; hostelId: string }) {
    return prisma.lead.findMany({
      where: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        deletedAt: null,
        status: { not: 'CONVERTED' },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 25,
          include: { session: { select: { startedAt: true, source: true } } },
        },
      },
    });
  }

  convertHostelEnquiry(input: {
    tenantId: string;
    hostelId: string;
    leadId: string;
    name: string;
    email?: string;
    phone: string;
    dateOfBirth?: Date;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    admissionDate: Date;
    roomId?: string;
    bedId?: string;
    actorId?: string;
  }) {
    return this.withAllocationRetry(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: {
          id: input.leadId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          deletedAt: null,
        },
      });
      if (!lead) throw new Error('Hostel enquiry not found');
      if (lead.phone.replace(/\D/g, '') !== input.phone.replace(/\D/g, '')) {
        throw new Error('Student phone must match the enquiry phone');
      }

      const linkedStudent = await tx.student.findFirst({
        where: { tenantId: input.tenantId, enquiryLeadId: lead.id },
      });
      if (linkedStudent) {
        await this.applyActiveFeesToStudent(
          tx,
          linkedStudent.id,
          input.tenantId,
          input.hostelId,
          new Date(),
        );
        const updatedStudent = await tx.student.findUnique({
          where: { id: linkedStudent.id },
        });
        if (!updatedStudent) throw new Error('Converted student record was not found');
        return { student: updatedStudent, alreadyConverted: true };
      }

      const normalizedPhone = input.phone.replace(/\D/g, '');
      await tx.$queryRaw<Array<{ pg_advisory_xact_lock: null }>>`
        SELECT pg_advisory_xact_lock(
          hashtext(${input.tenantId}),
          hashtext(${normalizedPhone})
        )
      `;

      const duplicateStudents = await tx.$queryRaw<Array<{
        id: string;
        enquiryLeadId: string | null;
        hostelId: string;
      }>>`
        SELECT "id", "enquiryLeadId", "hostelId"
        FROM "Student"
        WHERE "tenantId" = ${input.tenantId}
          AND regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') =
              regexp_replace(${input.phone}, '[^0-9]', '', 'g')
        ORDER BY "createdAt" ASC
        LIMIT 1
      `;
      const duplicate = duplicateStudents[0];
      if (duplicate && duplicate.hostelId !== input.hostelId) {
        throw new Error('This student already has an admission under another hostel');
      }
      if (duplicate?.enquiryLeadId && duplicate.enquiryLeadId !== lead.id) {
        throw new Error('This student is already linked to another enquiry');
      }

      let student;
      let temporaryPasskey: string | undefined;
      let existingStudent = false;
      if (duplicate) {
        student = await tx.student.update({
          where: { id: duplicate.id },
          data: { enquiryLead: { connect: { id_tenantId: { id: lead.id, tenantId: input.tenantId } } } },
        });
        existingStudent = true;
      } else {
        temporaryPasskey = randomBytes(6).toString('base64url').slice(0, 10);
        const passwordHash = hashPassword(temporaryPasskey);
        const admissionYear = input.admissionDate.getUTCFullYear();
        const [counter] = await tx.$queryRaw<Array<{ lastValue: number }>>`
          INSERT INTO "HostelAdmissionNumberCounter" ("tenantId", "admissionYear", "lastValue")
          VALUES (${input.tenantId}, ${admissionYear}, 1)
          ON CONFLICT ("tenantId", "admissionYear")
          DO UPDATE SET "lastValue" = "HostelAdmissionNumberCounter"."lastValue" + 1
          RETURNING "lastValue"
        `;
        if (!counter) throw new Error('Failed to allocate an admission number.');

        const admissionNumber = `ADM-${admissionYear}-${String(counter.lastValue).padStart(5, '0')}`;
        student = await tx.student.create({
          data: {
            admissionNumber,
            name: input.name,
            email: input.email,
            phone: input.phone,
            dateOfBirth: input.dateOfBirth,
            emergencyName: input.emergencyName,
            emergencyPhone: input.emergencyPhone,
            emergencyRelation: input.emergencyRelation,
            admissionDate: input.admissionDate,
            paymentStatus: 'DUE',
            status: 'ACTIVE',
            tenant: { connect: { id: input.tenantId } },
            hostel: { connect: { id_tenantId: { id: input.hostelId, tenantId: input.tenantId } } },
            enquiryLead: { connect: { id_tenantId: { id: lead.id, tenantId: input.tenantId } } },
          },
        });
        await tx.studentAccount.create({
          data: {
            tenantId: input.tenantId,
            studentId: student.id,
            passwordHash,
            isActive: true,
          },
        });
      }

      if (input.roomId && input.bedId) {
        const room = await tx.room.findFirst({
          where: { id: input.roomId, tenantId: input.tenantId, hostelId: input.hostelId, isActive: true },
        });
        if (!room || room.status === 'MAINTENANCE' || room.status === 'INACTIVE') {
          throw new Error('Room is unavailable');
        }
        if (student.roomId && student.roomId !== room.id) {
          throw new Error('Student is already assigned to another room');
        }

        const bed = await tx.roomBed.findFirst({
          where: {
            id: input.bedId,
            tenantId: input.tenantId,
            hostelId: input.hostelId,
            roomId: room.id,
            OR: [
              { status: 'AVAILABLE', studentId: null },
              { status: 'RESERVED', studentId: student.id },
              { status: 'OCCUPIED', studentId: student.id },
            ],
          },
        });
        if (!bed) throw new Error('Bed is unavailable');

        if (bed.status === 'AVAILABLE') {
          const bedUpdate = await tx.roomBed.updateMany({
            where: {
              id: bed.id,
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              roomId: room.id,
              OR: [
                { status: 'AVAILABLE', studentId: null },
                { status: 'RESERVED', studentId: student.id },
              ],
            },
            data: { status: 'RESERVED', studentId: student.id },
          });
          if (bedUpdate.count !== 1) throw new Error('Bed is unavailable');
          await tx.roomAllocation.create({
            data: {
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              roomId: room.id,
              bedId: bed.id,
              studentId: student.id,
              actorId: input.actorId,
              action: 'RESERVED',
            },
          });
          await this.syncRoomBedState(tx, input.tenantId, room.id);
        }
      }

      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      });

      const sessions = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "LeadSession"
        WHERE "tenantId" = ${input.tenantId} AND "leadId" = ${lead.id} AND "deletedAt" IS NULL
        ORDER BY "startedAt" DESC LIMIT 1
      `;
      let sessionId = sessions[0]?.id;
      if (!sessionId) {
        const [session] = await tx.$queryRaw<Array<{ id: string }>>`
          INSERT INTO "LeadSession" ("id", "tenantId", "leadId", "startedAt", "lastActivityAt", "source")
          VALUES (${crypto.randomUUID()}, ${input.tenantId}, ${lead.id}, NOW(), NOW(), 'HOSTEL_ENQUIRY')
          RETURNING "id"
        `;
        sessionId = session.id;
      } else {
        await tx.leadSession.update({ where: { id: sessionId }, data: { lastActivityAt: new Date() } });
      }

      await tx.leadActivity.create({
        data: {
          tenantId: input.tenantId,
          leadId: lead.id,
          sessionId,
          type: 'hostel_admission_converted',
          metadata: {
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            hostelId: input.hostelId,
            actorId: input.actorId ?? null,
          },
        },
      });

      await this.applyActiveFeesToStudent(
        tx,
        student.id,
        input.tenantId,
        input.hostelId,
        new Date(),
      );
      const updatedStudent = await tx.student.findUnique({
        where: { id: student.id },
      });
      if (!updatedStudent) throw new Error('Admitted student record was not found');

      return {
        student: updatedStudent,
        temporaryPasskey,
        alreadyConverted: false,
        existingStudent,
      };
    });
  }

  async createStudent(input: {
    tenantId: string;
    hostelId: string;
    admissionRequestId: string;
    roomId?: string;
    bedId?: string;
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    admissionDate?: Date;
    actorId?: string;
    paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
    status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'ARCHIVED';
  }) {
    const temporaryPasskey = randomBytes(6)
      .toString('base64url')
      .slice(0, 10);

    const passwordHash = hashPassword(temporaryPasskey);

    const admissionDate = input.admissionDate ?? new Date();
    const admissionYear = admissionDate.getUTCFullYear();

    try {
      return await this.withAllocationRetry(async (tx) => {
        const priorRequest = await tx.student.findFirst({
          where: { tenantId: input.tenantId, admissionRequestId: input.admissionRequestId },
        });
        if (priorRequest) {
          if (priorRequest.hostelId !== input.hostelId) {
            throw new Error('Admission request key has already been used');
          }
          if ((priorRequest.phone ?? '').replace(/\D/g, '') !== (input.phone ?? '').replace(/\D/g, '')) {
            throw new Error('Admission request key has already been used');
          }
          const priorBed = await tx.roomBed.findFirst({
            where: { tenantId: input.tenantId, studentId: priorRequest.id, status: 'RESERVED' },
            select: { id: true },
          });
          await this.applyActiveFeesToStudent(
            tx,
            priorRequest.id,
            input.tenantId,
            input.hostelId,
            new Date(),
          );
          const updatedStudent = await tx.student.findUnique({
            where: { id: priorRequest.id },
          });
          if (!updatedStudent) throw new Error('Admitted student record was not found');
          return {
            student: updatedStudent,
            existingStudent: true,
            bedReserved: Boolean(priorBed),
          };
        }

        const normalizedPhone = input.phone?.replace(/\D/g, '');
        if (normalizedPhone) {
          await tx.$queryRaw<Array<{ pg_advisory_xact_lock: null }>>`
            SELECT pg_advisory_xact_lock(hashtext(${input.tenantId}), hashtext(${normalizedPhone}))
          `;
          const matchingStudent = await tx.$queryRaw<Array<{ id: string; admissionNumber: string }>>`
            SELECT "id", "admissionNumber"
            FROM "Student"
            WHERE "tenantId" = ${input.tenantId}
              AND regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') = ${normalizedPhone}
            ORDER BY "createdAt" ASC
            LIMIT 1
          `;
          if (matchingStudent[0]) {
            throw new Error(`A student with this phone is already admitted (${matchingStudent[0].admissionNumber})`);
          }
        }

        let room: { id: string } | null = null;
        let bed: { id: string } | null = null;
        if (input.roomId && input.bedId) {
          room = await tx.room.findFirst({
            where: {
              id: input.roomId,
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              isActive: true,
              status: { notIn: ['MAINTENANCE', 'INACTIVE'] },
            },
            select: { id: true },
          });
          if (!room) throw new Error('Room is unavailable');
          bed = await tx.roomBed.findFirst({
            where: {
              id: input.bedId,
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              roomId: room.id,
              status: 'AVAILABLE',
              studentId: null,
            },
            select: { id: true },
          });
          if (!bed) throw new Error('Bed is unavailable');
        }

        const [counter] = await tx.$queryRaw<Array<{ lastValue: number }>>`
          INSERT INTO "HostelAdmissionNumberCounter"
            ("tenantId", "admissionYear", "lastValue")
          VALUES (${input.tenantId}, ${admissionYear}, 1)
          ON CONFLICT ("tenantId", "admissionYear")
          DO UPDATE SET "lastValue" = "HostelAdmissionNumberCounter"."lastValue" + 1
          RETURNING "lastValue"
        `;
        if (!counter) throw new Error('Failed to allocate an admission number.');

        const admissionNumber =
          `ADM-${admissionYear}-${String(counter.lastValue).padStart(5, '0')}`;
        const student = await tx.student.create({
          data: {
            admissionNumber,
            admissionRequestId: input.admissionRequestId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            dateOfBirth: input.dateOfBirth,
            emergencyName: input.emergencyName,
            emergencyPhone: input.emergencyPhone,
            emergencyRelation: input.emergencyRelation,
            admissionDate,
            paymentStatus: input.paymentStatus,
            status: input.status,
            tenant: { connect: { id: input.tenantId } },
            hostel: {
              connect: {
                id_tenantId: { id: input.hostelId, tenantId: input.tenantId },
              },
            },
          },
        });

        await tx.studentAccount.create({
          data: {
            tenantId: input.tenantId,
            studentId: student.id,
            passwordHash,
            isActive: true,
          },
        });

        if (room && bed) {
          const reservation = await tx.roomBed.updateMany({
            where: {
              id: bed.id,
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              roomId: room.id,
              status: 'AVAILABLE',
              studentId: null,
            },
            data: { status: 'RESERVED', studentId: student.id },
          });
          if (reservation.count !== 1) throw new Error('Bed is unavailable');

          await tx.roomAllocation.create({
            data: {
              tenantId: input.tenantId,
              hostelId: input.hostelId,
              roomId: room.id,
              bedId: bed.id,
              studentId: student.id,
              actorId: input.actorId,
              action: 'RESERVED',
            },
          });
          await this.syncRoomBedState(tx, input.tenantId, room.id);
        }

        await this.applyActiveFeesToStudent(
          tx,
          student.id,
          input.tenantId,
          input.hostelId,
          new Date(),
        );
        const updatedStudent = await tx.student.findUnique({
          where: { id: student.id },
        });
        if (!updatedStudent) throw new Error('Admitted student record was not found');

        return {
          student: updatedStudent,
          temporaryPasskey,
          existingStudent: false,
          bedReserved: Boolean(bed),
        };
      }, 15_000);
    } catch (error: unknown) {
      const priorRequest = await prisma.student.findFirst({
        where: { tenantId: input.tenantId, admissionRequestId: input.admissionRequestId },
      });
      if (priorRequest?.hostelId === input.hostelId) {
        if ((priorRequest.phone ?? '').replace(/\D/g, '') !== (input.phone ?? '').replace(/\D/g, '')) {
          throw new Error('Admission request key has already been used');
        }
        const priorBed = await prisma.roomBed.findFirst({
          where: { tenantId: input.tenantId, studentId: priorRequest.id, status: 'RESERVED' },
          select: { id: true },
        });
        return {
          student: priorRequest,
          existingStudent: true,
          bedReserved: Boolean(priorBed),
        };
      }
      if (priorRequest) throw new Error('Admission request key has already been used');
      throw error;
    }
  }

  async updateStudent(input: {
    tenantId: string;
    id: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    dateOfBirth?: Date | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    emergencyRelation?: string | null;
    admissionDate?: Date;
    paymentStatus?: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
    status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'ARCHIVED';
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.student.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });
      if (!existing) throw new Error('Student not found');

      const { tenantId, id, ...data } = input;
      await tx.student.update({ where: { id }, data });

      if (input.status === 'ACTIVE' || existing.status === 'ACTIVE') {
        await this.applyActiveFeesToStudent(
          tx,
          id,
          tenantId,
          existing.hostelId,
          new Date(),
        );
      }

      const updated = await tx.student.findUnique({ where: { id } });
      if (!updated) throw new Error('Student not found');
      return updated;
    });
  }

  findStaff(input: { tenantId: string; hostelId: string }) {
    return prisma.hostelStaffAssignment.findMany({
      where: { tenantId: input.tenantId, hostelId: input.hostelId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAvailableStaffUsers(tenantId: string) {
    return prisma.tenantUser.findMany({
      where: {
        tenantId,
        role: 'staff',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createStaffAssignment(input: {
    tenantId: string;
    hostelId: string;
    userId: string;
    role: 'ADMIN' | 'STAFF';
  }) {
    return prisma.hostelStaffAssignment.create({
      data: {
        role: input.role,
        tenant: { connect: { id: input.tenantId } },
        hostel: {
          connect: { id_tenantId: { id: input.hostelId, tenantId: input.tenantId } },
        },
        user: {
          connect: { id_tenantId: { id: input.userId, tenantId: input.tenantId } },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  deleteStaffAssignment(input: {
    tenantId: string;
    hostelId: string;
    assignmentId: string;
  }) {
    return prisma.hostelStaffAssignment.deleteMany({
      where: {
        id: input.assignmentId,
        tenantId: input.tenantId,
        hostelId: input.hostelId,
      },
    });
  }

  updateStaffAssignment(input: {
    tenantId: string;
    hostelId: string;
    assignmentId: string;
    role: 'ADMIN' | 'STAFF';
  }) {
    return prisma.hostelStaffAssignment.updateMany({
      where: {
        id: input.assignmentId,
        tenantId: input.tenantId,
        hostelId: input.hostelId,
      },
      data: {
        role: input.role,
      },
    });
  }

  async initiatePayment(input: {
    tenantId: string;
    studentId?: string;
    studentUserId?: string;
    amount: number;
  }) {
    const student = await prisma.student.findFirst({
      where: {
        tenantId: input.tenantId,
        ...(input.studentId ? { id: input.studentId } : {}),
        ...(input.studentUserId
        ? {
            studentAccount: {
              id: input.studentUserId,
            },
          }
        : {}),
      },
      select: { id: true, outstandingAmount: true },
    });
    if (!student) throw new Error('Student not found');
    if (input.amount <= 0) throw new Error('Payment amount must be positive');
    if (student.outstandingAmount.lte(0)) throw new Error('No outstanding amount due');
    if (new Prisma.Decimal(input.amount).gt(student.outstandingAmount)) {
      throw new Error('Payment amount cannot exceed the outstanding amount');
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: { upiVpa: true, upiPayeeName: true },
    });
    if (!settings?.upiVpa) throw new Error('UPI payment configuration is not available');

    return prisma.payment.create({
      data: {
        tenantId: input.tenantId,
        studentId: student.id,
        amount: new Prisma.Decimal(input.amount),
        upiVpa: settings.upiVpa,
        status: 'INITIATED',
        metadata: { payeeName: settings.upiPayeeName ?? undefined },
      },
      include: { student: { select: { id: true, name: true, admissionNumber: true } } },
    });
  }

  async listPayments(input: {
    tenantId: string;
    studentId?: string;
    studentUserId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.studentUserId
        ? {
            student: {
              studentAccount: {
                id: input.studentUserId,
              },
            },
          }
        : {}),
      ...(input.status ? { status: input.status as never } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: { receipt: true },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.payment.count({ where }),
    ]);
    return { items, total };
  }

  findPayment(input: { tenantId: string; id: string; studentId?: string; studentUserId?: string }) {
    return prisma.payment.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        ...(input.studentId ? { studentId: input.studentId } : {}),
        ...(input.studentUserId
        ? {
            student: {
              studentAccount: {
                id: input.studentUserId,
              },
            },
          }
        : {}),
      },
      include: {
        receipt: true,
        student: { select: { id: true, name: true, admissionNumber: true } },
      },
    });
  }

  async submitPayment(input: {
    tenantId: string;
    id: string;
    studentId?: string;
    studentUserId?: string;
    utr: string;
    transactionReferenceId?: string;
    proofUrl?: string;
    idempotencyKey: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          id: input.id,
          tenantId: input.tenantId,
          ...(input.studentId ? { studentId: input.studentId } : {}),
          ...(input.studentUserId
        ? {
            student: {
              studentAccount: {
                id: input.studentUserId,
              },
            },
          }
        : {}),
        },
      });
      if (!payment) throw new Error('Payment not found');
      if (payment.submitIdempotencyKey === input.idempotencyKey) return payment;
      if (!['INITIATED', 'PENDING'].includes(payment.status))
        throw new Error('Payment cannot be submitted in its current state');
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUBMITTED',
          utr: input.utr,
          transactionReferenceId: input.transactionReferenceId,
          proofUrl: input.proofUrl,
          submitIdempotencyKey: input.idempotencyKey,
          submittedAt: new Date(),
        },
        include: { receipt: true },
      });
    });
  }

  async verifyPayment(input: {
    tenantId: string;
    id: string;
    actorId: string;
    idempotencyKey: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
        include: { student: true, receipt: true },
      });

      if (!payment) throw new Error('Payment not found');

      if (
        payment.verifyIdempotencyKey === input.idempotencyKey &&
        payment.receipt
      ) {
        return tx.payment.findFirst({
          where: { id: payment.id, tenantId: input.tenantId },
          include: {
            receipt: true,
            invoiceAllocations: {
              include: {
                invoice: true,
              },
            },
          },
        });
      }

      if (!['SUBMITTED', 'VERIFYING'].includes(payment.status)) {
        throw new Error('Payment must be submitted before verification');
      }

      if (payment.amount.gt(payment.student.outstandingAmount)) {
        throw new Error('Payment exceeds the current outstanding amount');
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'VERIFYING' },
      });

      const invoices = await tx.hostelInvoice.findMany({
        where: {
          tenantId: input.tenantId,
          studentId: payment.studentId,
          status: {
            in: ['ISSUED', 'PARTIALLY_PAID'],
          },
          balanceAmount: { gt: 0 },
        },
        orderBy: [
          { issueDate: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      let remainingPayment = payment.amount;

      if (invoices.length > 0) {
        const totalInvoiceBalance = invoices.reduce(
          (sum, invoice) => sum.add(invoice.balanceAmount),
          new Prisma.Decimal(0),
        );

        if (totalInvoiceBalance.lt(payment.amount)) {
          throw new Error(
            "Payment exceeds the total balance of the student's open invoices",
          );
        }

        for (const invoice of invoices) {
          if (remainingPayment.lte(0)) break;

          const allocationAmount = remainingPayment.lt(invoice.balanceAmount)
            ? remainingPayment
            : invoice.balanceAmount;

          if (allocationAmount.lte(0)) continue;

          await tx.hostelInvoicePayment.create({
            data: {
              tenantId: input.tenantId,
              invoiceId: invoice.id,
              paymentId: payment.id,
              amount: allocationAmount,
            },
          });

          const paidAmount = invoice.paidAmount.add(allocationAmount);
          const balanceAmount = invoice.totalAmount.sub(paidAmount);

          await tx.hostelInvoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount,
              balanceAmount: balanceAmount.gt(0)
                ? balanceAmount
                : new Prisma.Decimal(0),
              status: balanceAmount.lte(0) ? 'PAID' : 'PARTIALLY_PAID',
            },
          });

          remainingPayment = remainingPayment.sub(allocationAmount);
        }
      }

      const remainingOutstanding = payment.student.outstandingAmount.sub(
        payment.amount,
      );

      await tx.student.update({
        where: { id: payment.studentId },
        data: {
          outstandingAmount: { decrement: payment.amount },
          paymentStatus: remainingOutstanding.gt(0) ? 'PARTIAL' : 'PAID',
        },
      });

      const receipt = await tx.paymentReceipt.create({
        data: {
          tenantId: input.tenantId,
          paymentId: payment.id,
          receiptNumber: `RL-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,
          metadata: { verifiedBy: input.actorId },
        },
      });

      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          receiptId: receipt.id,
          verifiedAt: new Date(),
          verifiedBy: input.actorId,
          verifyIdempotencyKey: input.idempotencyKey,
        },
        include: {
          receipt: true,
          invoiceAllocations: {
            include: {
              invoice: true,
            },
          },
        },
      });
    });
  }

  async rejectPayment(input: {
    tenantId: string;
    id: string;
    actorId: string;
    reason: string;
    idempotencyKey: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: input.id, tenantId: input.tenantId },
      });
      if (!payment) throw new Error('Payment not found');
      if (payment.verifyIdempotencyKey === input.idempotencyKey) return payment;
      if (!['SUBMITTED', 'VERIFYING'].includes(payment.status))
        throw new Error('Payment cannot be rejected in its current state');
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          rejectedReason: input.reason,
          verifiedBy: input.actorId,
          verifyIdempotencyKey: input.idempotencyKey,
        },
      });
    });
  }

  async listReceipts(input: {
    tenantId: string;
    studentId?: string;
    studentUserId?: string;
    paymentId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const search = input.search?.trim();

    const where = {
      tenantId: input.tenantId,

      ...(input.paymentId
        ? {
            paymentId: input.paymentId,
          }
        : {}),

      ...(input.studentId || input.studentUserId
        ? {
            payment: {
              ...(input.studentId
                ? {
                    studentId: input.studentId,
                  }
                : {}),
              ...(input.studentUserId
                ? {
                    student: {
                      studentAccount: {
                        id: input.studentUserId,
                      },
                    },
                  }
                : {}),
            },
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                receiptNumber: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                payment: {
                  utr: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                payment: {
                  transactionReferenceId: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                payment: {
                  student: {
                    name: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
              {
                payment: {
                  student: {
                    admissionNumber: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.paymentReceipt.findMany({
        where,
        include: {
          payment: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  admissionNumber: true,
                },
              },
              invoiceAllocations: {
                include: {
                  invoice: {
                    select: {
                      id: true,
                      invoiceNumber: true,
                      totalAmount: true,
                      paidAmount: true,
                      balanceAmount: true,
                      status: true,
                      issueDate: true,
                      dueDate: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.paymentReceipt.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findReceipt(input: {
    tenantId: string;
    id: string;
    studentUserId?: string;
  }) {
    return prisma.paymentReceipt.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,

        ...(input.studentUserId
          ? {
              payment: {
                student: {
                  studentAccount: {
                    id: input.studentUserId,
                  },
                },
              },
            }
          : {}),
      },

      include: {
        payment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
              },
            },
            invoiceAllocations: {
              include: {
                invoice: {
                  include: {
                    items: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  async getFeeCollectionSummary(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
  }) {
    const assignmentWhere = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.from || input.to
        ? {
            assignedAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const invoiceWhere = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.from || input.to
        ? {
            issueDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const paymentWhere = {
      tenantId: input.tenantId,
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.hostelId
        ? {
            student: {
              hostelId: input.hostelId,
            },
          }
        : {}),
      status: 'PAID' as const,
      ...(input.from || input.to
        ? {
            verifiedAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const receiptWhere = {
      tenantId: input.tenantId,
      ...(input.studentId || input.hostelId
        ? {
            payment: {
              ...(input.studentId
                ? {
                    studentId: input.studentId,
                  }
                : {}),
              ...(input.hostelId
                ? {
                    student: {
                      hostelId: input.hostelId,
                    },
                  }
                : {}),
            },
          }
        : {}),
      ...(input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const studentWhere = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { id: input.studentId } : {}),
    };

    const [
      feeAssignments,
      invoices,
      payments,
      receipts,
      outstanding,
    ] = await prisma.$transaction([
      prisma.hostelFeeAssignment.aggregate({
        where: assignmentWhere,
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.hostelInvoice.aggregate({
        where: invoiceWhere,
        _count: {
          _all: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.payment.aggregate({
        where: paymentWhere,
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.paymentReceipt.count({
        where: receiptWhere,
      }),

      prisma.student.aggregate({
        where: studentWhere,
        _sum: {
          outstandingAmount: true,
        },
      }),
    ]);

    return {
      feeAssignmentCount: feeAssignments._count._all,
      assignedAmount: feeAssignments._sum.amount?.toNumber() ?? 0,

      invoiceCount: invoices._count._all,
      invoicedAmount: invoices._sum.totalAmount?.toNumber() ?? 0,

      collectedAmount: payments._sum.amount?.toNumber() ?? 0,
      paymentCount: payments._count._all,

      receiptCount: receipts,

      outstandingAmount:
        outstanding._sum.outstandingAmount?.toNumber() ?? 0,
    };
  }

  async listStudentOutstandingReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { id: input.studentId } : {}),
      outstandingAmount: {
        gt: 0,
      },
    };

    const [items, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          name: true,
          admissionNumber: true,
          paymentStatus: true,
          outstandingAmount: true,
          admissionDate: true,
          hostel: {
            select: {
              id: true,
              name: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
            },
          },
        },
        orderBy: [
          {
            outstandingAmount: 'desc',
          },
          {
            name: 'asc',
          },
        ],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.student.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async listInvoiceReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.from || input.to
        ? {
            issueDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelInvoice.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              admissionNumber: true,
            },
          },
          hostel: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              amount: true,
              feeAssignmentId: true,
            },
          },
          _count: {
            select: {
              items: true,
              payments: true,
            },
          },
        },
        orderBy: [
          {
            issueDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.hostelInvoice.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async listPaymentReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.studentId
        ? {
            studentId: input.studentId,
          }
        : {}),
      ...(input.hostelId
        ? {
            student: {
              hostelId: input.hostelId,
            },
          }
        : {}),
      ...(input.status
        ? {
            status: input.status as never,
          }
        : {}),
      ...(input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              admissionNumber: true,
              hostel: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          receipt: true,
          invoiceAllocations: {
            include: {
              invoice: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  totalAmount: true,
                  paidAmount: true,
                  balanceAmount: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.payment.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async listReceiptReport(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,

      ...(input.studentId || input.hostelId
        ? {
            payment: {
              ...(input.studentId
                ? {
                    studentId: input.studentId,
                  }
                : {}),
              ...(input.hostelId
                ? {
                    student: {
                      hostelId: input.hostelId,
                    },
                  }
                : {}),
            },
          }
        : {}),

      ...(input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.paymentReceipt.findMany({
        where,
        include: {
          payment: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  admissionNumber: true,
                  hostel: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              invoiceAllocations: {
                include: {
                  invoice: {
                    select: {
                      id: true,
                      invoiceNumber: true,
                      totalAmount: true,
                      paidAmount: true,
                      balanceAmount: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.paymentReceipt.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  // ---------------------------------------------------------------------------
  // Reconciliation
  // ---------------------------------------------------------------------------

  async listPaymentReconciliation(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      status: 'PAID' as const,

      ...(input.studentId
        ? {
            studentId: input.studentId,
          }
        : {}),

      ...(input.hostelId
        ? {
            student: {
              hostelId: input.hostelId,
            },
          }
        : {}),

      ...(input.from || input.to
        ? {
            verifiedAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,

        include: {
          student: {
            select: {
              id: true,
              name: true,
              admissionNumber: true,
              hostel: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          receipt: true,

          invoiceAllocations: {
            include: {
              invoice: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  totalAmount: true,
                  paidAmount: true,
                  balanceAmount: true,
                  status: true,
                  issueDate: true,
                  dueDate: true,
                },
              },
            },
          },
        },

        orderBy: {
          verifiedAt: 'desc',
        },

        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),

      prisma.payment.count({
        where,
      }),
    ]);

    const items = payments.map((payment) => {
      const allocatedAmount = payment.invoiceAllocations.reduce(
        (sum, allocation) => sum + allocation.amount.toNumber(),
        0,
      );

      const paymentAmount = payment.amount.toNumber();

      const difference = paymentAmount - allocatedAmount;

      return {
        paymentId: payment.id,
        paymentAmount,
        allocatedAmount,
        difference,

        reconciled: Math.abs(difference) < 0.01,

        status: payment.status,
        utr: payment.utr,
        transactionReferenceId: payment.transactionReferenceId,
        verifiedAt: payment.verifiedAt,
        createdAt: payment.createdAt,

        student: payment.student,

        receipt: payment.receipt,

        invoiceAllocations: payment.invoiceAllocations,
      };
    });

    return {
      items,
      total,
    };
  }
  // ---------------------------------------------------------------------------
  // Deposits
  // ---------------------------------------------------------------------------

  async listDeposits(input: {
    tenantId: string;
    hostelId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.from || input.to
        ? {
            depositDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelDeposit.findMany({
        where,
        orderBy: [{ depositDate: 'desc' }, { createdAt: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.hostelDeposit.count({ where }),
    ]);

    return { items, total };
  }

  async findDeposit(input: { tenantId: string; id: string }) {
    return prisma.hostelDeposit.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });
  }

  async createDeposit(input: {
    tenantId: string;
    hostelId: string;
    amount: number;
    currency?: string;
    depositDate?: Date;
    paymentMethod?: string;
    reference?: string;
    depositedBy?: string;
    notes?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    const hostel = await prisma.hostel.findFirst({
      where: {
        id: input.hostelId,
        tenantId: input.tenantId,
      },
      select: { id: true },
    });

    if (!hostel) throw new Error('Hostel not found');

    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new Error('Deposit amount must be positive');

    return prisma.hostelDeposit.create({
      data: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        amount,
        currency: input.currency ?? 'INR',
        depositDate: input.depositDate ?? new Date(),
        ...(input.paymentMethod !== undefined
          ? { paymentMethod: input.paymentMethod as never }
          : {}),
        referenceNumber: input.reference,
        depositedBy: input.depositedBy,
        notes: input.notes,
      },
    });
  }

  async updateDeposit(input: {
    tenantId: string;
    id: string;
    amount?: number;
    currency?: string;
    depositDate?: Date;
    paymentMethod?: string;
    reference?: string | null;
    depositedBy?: string | null;
    notes?: string | null;
    metadata?: Prisma.InputJsonValue | null;
  }) {
    const existing = await prisma.hostelDeposit.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!existing) throw new Error('Deposit not found');

    if ((existing.status as string) === 'CANCELLED') {
      throw new Error('Cancelled deposits cannot be updated');
    }

    if ((existing.status as string) === 'RECONCILED') {
      throw new Error('Reconciled deposits cannot be updated');
    }

    const amount =
      input.amount !== undefined
        ? new Prisma.Decimal(input.amount)
        : undefined;

    if (amount && amount.lte(0)) {
      throw new Error('Deposit amount must be positive');
    }

    return prisma.hostelDeposit.update({
      where: { id: existing.id },
      data: {
        ...(amount !== undefined ? { amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.depositDate !== undefined
          ? { depositDate: input.depositDate }
          : {}),
        ...(input.paymentMethod !== undefined
          ? { paymentMethod: input.paymentMethod as never }
          : {}),
        ...(input.reference !== undefined
          ? { referenceNumber: input.reference }
          : {}),
        ...(input.depositedBy !== undefined
          ? { depositedBy: input.depositedBy }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),

      },
    });
  }

  async reconcileDeposit(input: { tenantId: string; id: string }) {
    const deposit = await prisma.hostelDeposit.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!deposit) throw new Error('Deposit not found');

    if ((deposit.status as string) === 'CANCELLED') {
      throw new Error('Cancelled deposits cannot be reconciled');
    }

    if ((deposit.status as string) === 'RECONCILED') {
      return deposit;
    }

    return prisma.hostelDeposit.update({
      where: { id: deposit.id },
      data: {
        status: 'RECONCILED' as never,
        reconciledAt: new Date(),
      },
    });
  }

  async cancelDeposit(input: { tenantId: string; id: string }) {
    const deposit = await prisma.hostelDeposit.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!deposit) throw new Error('Deposit not found');

    if ((deposit.status as string) === 'RECONCILED') {
      throw new Error('Reconciled deposits cannot be cancelled');
    }

    if ((deposit.status as string) === 'CANCELLED') {
      return deposit;
    }

    return prisma.hostelDeposit.update({
      where: { id: deposit.id },
      data: {
        status: 'CANCELLED' as never,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Ledger
  // ---------------------------------------------------------------------------

  async listLedgerEntries(input: {
    tenantId: string;
    hostelId?: string;
    type?: string;
    direction?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.type ? { type: input.type as never } : {}),
      ...(input.direction ? { direction: input.direction as never } : {}),
      ...(input.from || input.to
        ? {
            entryDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelLedgerEntry.findMany({
        where,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.hostelLedgerEntry.count({ where }),
    ]);

    return { items, total };
  }

  async findLedgerEntry(input: { tenantId: string; id: string }) {
    return prisma.hostelLedgerEntry.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });
  }

  async createLedgerEntry(input: {
    tenantId: string;
    hostelId: string;
    entryDate?: Date;
    type: string;
    direction: string;
    amount: number;
    currency?: string;
    referenceType?: string;
    referenceId?: string;
    description: string;
    createdBy?: string;
  }) {
    const hostel = await prisma.hostel.findFirst({
      where: {
        id: input.hostelId,
        tenantId: input.tenantId,
      },
      select: { id: true },
    });

    if (!hostel) throw new Error('Hostel not found');

    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new Error('Ledger amount must be positive');

    return prisma.hostelLedgerEntry.create({
      data: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        entryDate: input.entryDate ?? new Date(),
        type: input.type as never,
        direction: input.direction as never,
        amount,
        currency: input.currency ?? 'INR',
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
        createdBy: input.createdBy,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Complaints
  // ---------------------------------------------------------------------------

  async listComplaints(input: {
    tenantId: string;
    hostelId?: string;
    studentId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.priority ? { priority: input.priority as never } : {}),
      ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
      ...(input.search
        ? {
            OR: [
              {
                subject: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelComplaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.hostelComplaint.count({ where }),
    ]);

    return { items, total };
  }

  async findComplaint(input: { tenantId: string; id: string }) {
    return prisma.hostelComplaint.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });
  }

  async createComplaint(input: {
    tenantId: string;
    hostelId: string;
    studentId?: string;
    subject: string;
    description: string;
    priority?: string;
    assignedTo?: string;
  }) {
    const hostel = await prisma.hostel.findFirst({
      where: {
        id: input.hostelId,
        tenantId: input.tenantId,
      },
      select: { id: true },
    });

    if (!hostel) throw new Error('Hostel not found');

    if (input.studentId) {
      const student = await prisma.student.findFirst({
        where: {
          id: input.studentId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
        },
        select: { id: true },
      });

      if (!student) throw new Error('Student not found');
    }

    if (input.assignedTo) {
      const assignee = await prisma.tenantUser.findFirst({
        where: {
          id: input.assignedTo,
          tenantId: input.tenantId,
        },
        select: { id: true },
      });

      if (!assignee) throw new Error('Assigned user not found');
    }

    return prisma.hostelComplaint.create({
      data: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        studentId: input.studentId,
        subject: input.subject,
        description: input.description,
        priority: (input.priority ?? 'MEDIUM') as never,
        status: 'OPEN' as never,
        assignedTo: input.assignedTo,
      },
    });
  }

  async updateComplaint(input: {
    tenantId: string;
    id: string;
    subject?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string | null;
    resolution?: string | null;
    resolvedAt?: Date | null;
  }) {
    const existing = await prisma.hostelComplaint.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!existing) throw new Error('Complaint not found');

    if (input.assignedTo) {
      const assignee = await prisma.tenantUser.findFirst({
        where: {
          id: input.assignedTo,
          tenantId: input.tenantId,
        },
        select: { id: true },
      });

      if (!assignee) throw new Error('Assigned user not found');
    }

    const nextStatus = input.status ?? (existing.status as string);
    const resolutionStatus =
      nextStatus === 'RESOLVED' || nextStatus === 'CLOSED';

    return prisma.hostelComplaint.update({
      where: { id: existing.id },
      data: {
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.priority !== undefined
          ? { priority: input.priority as never }
          : {}),
        ...(input.status !== undefined
          ? { status: input.status as never }
          : {}),
        ...(input.assignedTo !== undefined
          ? { assignedTo: input.assignedTo }
          : {}),
        ...(input.resolution !== undefined
          ? { resolution: input.resolution }
          : {}),
        ...(input.resolvedAt !== undefined
          ? { resolvedAt: input.resolvedAt }
          : resolutionStatus
            ? { resolvedAt: new Date() }
            : {}),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Announcements
  // ---------------------------------------------------------------------------

  async listAnnouncements(input: {
    tenantId: string;
    hostelId?: string;
    audience?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenantId: input.tenantId,
      ...(input.hostelId ? { hostelId: input.hostelId } : {}),
      ...(input.audience ? { audience: input.audience as never } : {}),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.search
        ? {
            OR: [
              {
                title: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                message: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.hostelAnnouncement.findMany({
        where,
        orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.hostelAnnouncement.count({ where }),
    ]);

    return { items, total };
  }

  async findAnnouncement(input: { tenantId: string; id: string }) {
    return prisma.hostelAnnouncement.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });
  }

  async createAnnouncement(input: {
    tenantId: string;
    hostelId: string;
    title: string;
    message: string;
    audience?: string;
    publishAt?: Date | null;
    expiresAt?: Date | null;
    createdBy?: string;
  }) {
    const hostel = await prisma.hostel.findFirst({
      where: {
        id: input.hostelId,
        tenantId: input.tenantId,
      },
      select: { id: true },
    });

    if (!hostel) throw new Error('Hostel not found');

    if (
      input.publishAt &&
      input.expiresAt &&
      input.expiresAt < input.publishAt
    ) {
      throw new Error('Announcement expiry cannot be before publish date');
    }

    return prisma.hostelAnnouncement.create({
      data: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        title: input.title,
        message: input.message,
        audience: (input.audience ?? 'ALL') as never,
        publishAt: input.publishAt,
        expiresAt: input.expiresAt,
        status: 'DRAFT' as never,
        createdBy: input.createdBy,
      },
    });
  }

  async updateAnnouncement(input: {
    tenantId: string;
    id: string;
    hostelId?: string;
    title?: string;
    message?: string;
    audience?: string;
    publishAt?: Date | null;
    expiresAt?: Date | null;
    status?: string;
  }) {
    const existing = await prisma.hostelAnnouncement.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!existing) throw new Error('Announcement not found');

    const publishAt =
      input.publishAt !== undefined
        ? input.publishAt
        : existing.publishAt;

    const expiresAt =
      input.expiresAt !== undefined
        ? input.expiresAt
        : existing.expiresAt;

    if (publishAt && expiresAt && expiresAt < publishAt) {
      throw new Error('Announcement expiry cannot be before publish date');
    }

    if (input.hostelId) {
      const hostel = await prisma.hostel.findFirst({
        where: {
          id: input.hostelId,
          tenantId: input.tenantId,
        },
        select: { id: true },
      });

      if (!hostel) throw new Error('Hostel not found');
    }

    return prisma.hostelAnnouncement.update({
      where: { id: existing.id },
      data: {
        ...(input.hostelId !== undefined
          ? { hostelId: input.hostelId }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.message !== undefined ? { message: input.message } : {}),
        ...(input.audience !== undefined
          ? { audience: input.audience as never }
          : {}),
        ...(input.publishAt !== undefined
          ? { publishAt: input.publishAt }
          : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt }
          : {}),
        ...(input.status !== undefined
          ? { status: input.status as never }
          : {}),
      },
    });
  }

  async publishAnnouncement(input: { tenantId: string; id: string }) {
    const announcement = await prisma.hostelAnnouncement.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!announcement) throw new Error('Announcement not found');

    if ((announcement.status as string) === 'ARCHIVED') {
      throw new Error('Archived announcements cannot be published');
    }

    return prisma.hostelAnnouncement.update({
      where: { id: announcement.id },
      data: {
        status: 'PUBLISHED' as never,
        publishAt: announcement.publishAt ?? new Date(),
      },
    });
  }

  async archiveAnnouncement(input: { tenantId: string; id: string }) {
    const announcement = await prisma.hostelAnnouncement.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
      },
    });

    if (!announcement) throw new Error('Announcement not found');

    if ((announcement.status as string) === 'ARCHIVED') {
      return announcement;
    }

    return prisma.hostelAnnouncement.update({
      where: { id: announcement.id },
      data: {
        status: 'ARCHIVED' as never,
      },
    });
  }


}