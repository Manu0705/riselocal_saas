import {
  HostelPropertyPrismaRepository,
  type HostelRepository,
} from '../infrastructure/hostel-property.prisma.repository';

const defaultRepository = new HostelPropertyPrismaRepository();

function requiredText(value: unknown, label: string, maxLength = 120): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }

  return normalized;
}

function positiveInteger(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function tenantIdValue(value: string): string {
  return requiredText(value, 'Tenant context');
}

function optionalDate(value: unknown, label: string): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`);
  return date;
}

function requiredDate(value: unknown, label: string): Date {
  return optionalDate(value, label) ?? new Date();
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
  fallback: T,
): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${label} is invalid`);
  }
  return value as T;
}

const PAYMENT_STATUSES = ['PAID', 'PARTIAL', 'DUE', 'OVERDUE'] as const;
const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'GRADUATED', 'ARCHIVED'] as const;
const SHARING_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORMITORY'] as const;
const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE'] as const;
const FEE_TYPES = [
  'MONTHLY',
  'ADMISSION',
  'SECURITY_DEPOSIT',
  'MESS',
  'ELECTRICITY',
  'MAINTENANCE',
  'OTHER',
] as const;
const FEE_ASSIGNMENT_STATUSES = ['ACTIVE', 'WAIVED', 'CANCELLED'] as const;
const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;

const DEPOSIT_STATUSES = ['PENDING', 'DEPOSITED', 'RECONCILED', 'CANCELLED'] as const;
const PAYMENT_METHODS = ['UPI'] as const;

const LEDGER_ENTRY_TYPES = [
  'PAYMENT',
  'DEPOSIT',
  'REFUND',
  'ADJUSTMENT',
  'EXPENSE',
  'OTHER',
] as const;

const LEDGER_DIRECTIONS = ['CREDIT', 'DEBIT'] as const;

const COMPLAINT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const COMPLAINT_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
] as const;

const ANNOUNCEMENT_AUDIENCES = ['ALL', 'STUDENTS', 'STAFF'] as const;
const ANNOUNCEMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export class HostelPropertyService {
  constructor(private readonly repository: HostelRepository = defaultRepository) {}

  async listHostels(tenantId: string) {
    return this.repository.findHostels(tenantIdValue(tenantId));
  }

  async createHostel(tenantId: string, name: unknown) {
    return this.repository.createHostel({
      tenantId: tenantIdValue(tenantId),
      name: requiredText(name, 'Hostel name'),
    });
  }


  async listFees(
    tenantId: string,
    input: {
      hostelId?: unknown;
      isActive?: unknown;
      type?: unknown;
      search?: unknown;
    } = {},
  ) {
    const normalizedIsActive =
      input.isActive === undefined || input.isActive === null || input.isActive === ''
        ? undefined
        : typeof input.isActive === 'boolean'
          ? input.isActive
          : typeof input.isActive === 'string' &&
              ['true', 'false'].includes(input.isActive.trim().toLowerCase())
            ? input.isActive.trim().toLowerCase() === 'true'
            : (() => {
                throw new Error('isActive must be a boolean');
              })();

    const type =
      input.type === undefined || input.type === null || input.type === ''
        ? undefined
        : enumValue(input.type, FEE_TYPES, 'Fee type', 'OTHER');

    const search =
      typeof input.search === 'string' ? input.search.trim().slice(0, 100) : undefined;

    return this.repository.listFees({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId ? requiredText(input.hostelId, 'hostelId') : undefined,
      isActive: normalizedIsActive,
      type,
      search: search || undefined,
    });
  }

  async getFee(tenantId: string, id: unknown) {
    return this.repository.findFee({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'feeId'),
    });
  }

  async createFee(tenantId: string, input: Record<string, unknown>) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Fee amount must be positive');
    }

    return this.repository.createFee({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      name: requiredText(input.name, 'Fee name'),
      type: enumValue(input.type, FEE_TYPES, 'Fee type', 'OTHER'),
      description:
        input.description === undefined
          ? undefined
          : requiredText(input.description, 'Description', 500),
      amount: Math.round(amount * 100) / 100,
      currency:
        input.currency === undefined
          ? undefined
          : requiredText(input.currency, 'Currency', 10),
    });
  }

  async updateFee(tenantId: string, id: unknown, input: Record<string, unknown>) {
    const amount =
      input.amount === undefined
        ? undefined
        : Number(input.amount);

    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      throw new Error('Fee amount must be positive');
    }

    return this.repository.updateFee({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'feeId'),
      name: input.name === undefined ? undefined : requiredText(input.name, 'Fee name'),
      type:
        input.type === undefined
          ? undefined
          : enumValue(input.type, FEE_TYPES, 'Fee type', 'OTHER'),
      description:
        input.description === undefined
          ? undefined
          : input.description === null
            ? null
            : requiredText(input.description, 'Description', 500),
      amount: amount === undefined ? undefined : Math.round(amount * 100) / 100,
      currency:
        input.currency === undefined
          ? undefined
          : requiredText(input.currency, 'Currency', 10),
      isActive:
        input.isActive === undefined
          ? undefined
          : typeof input.isActive === 'boolean'
            ? input.isActive
            : typeof input.isActive === 'string' &&
                ['true', 'false'].includes(input.isActive.trim().toLowerCase())
              ? input.isActive.trim().toLowerCase() === 'true'
              : (() => {
                  throw new Error('isActive must be a boolean');
                })(),
    });
  }

  async deactivateFee(tenantId: string, id: unknown) {
    return this.repository.deactivateFee({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'feeId'),
    });
  }

  async listFeeAssignments(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      feeId?: unknown;
      status?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));
    const status =
      input.status === undefined || input.status === null || input.status === ''
        ? undefined
        : enumValue(
            input.status,
            FEE_ASSIGNMENT_STATUSES,
            'Fee assignment status',
            'ACTIVE',
          );

    const result = await this.repository.listFeeAssignments({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId ? requiredText(input.hostelId, 'hostelId') : undefined,
      studentId: input.studentId ? requiredText(input.studentId, 'studentId') : undefined,
      feeId: input.feeId ? requiredText(input.feeId, 'feeId') : undefined,
      status,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getFeeAssignment(tenantId: string, id: unknown) {
    return this.repository.findFeeAssignment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'feeAssignmentId'),
    });
  }

  async createFeeAssignment(tenantId: string, input: Record<string, unknown>) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Fee assignment amount must be positive');
    }

    const periodStart = optionalDate(input.periodStart, 'Period start');
    const periodEnd = optionalDate(input.periodEnd, 'Period end');
    if (periodStart && periodEnd && periodEnd < periodStart) {
      throw new Error('Period end cannot be before period start');
    }

    return this.repository.createFeeAssignment({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      studentId: requiredText(input.studentId, 'studentId'),
      feeId: requiredText(input.feeId, 'feeId'),
      amount: Math.round(amount * 100) / 100,
      dueDate: optionalDate(input.dueDate, 'Due date'),
      periodStart,
      periodEnd,
    });
  }

  async updateFeeAssignment(tenantId: string, id: unknown, input: Record<string, unknown>) {
    const amount = input.amount === undefined ? undefined : Number(input.amount);
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      throw new Error('Fee assignment amount must be positive');
    }

    const periodStart =
      input.periodStart === undefined
        ? undefined
        : input.periodStart === null
          ? null
          : optionalDate(input.periodStart, 'Period start');
    const periodEnd =
      input.periodEnd === undefined
        ? undefined
        : input.periodEnd === null
          ? null
          : optionalDate(input.periodEnd, 'Period end');

    if (periodStart instanceof Date && periodEnd instanceof Date && periodEnd < periodStart) {
      throw new Error('Period end cannot be before period start');
    }

    return this.repository.updateFeeAssignment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'feeAssignmentId'),
      amount: amount === undefined ? undefined : Math.round(amount * 100) / 100,
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate === null
            ? null
            : optionalDate(input.dueDate, 'Due date'),
      periodStart,
      periodEnd,
      status:
        input.status === undefined
          ? undefined
          : enumValue(
              input.status,
              FEE_ASSIGNMENT_STATUSES,
              'Fee assignment status',
              'ACTIVE',
            ),
    });
  }

  async cancelFeeAssignment(tenantId: string, id: unknown) {
    return this.repository.cancelFeeAssignment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'feeAssignmentId'),
    });
  }

  async listInvoices(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      status?: unknown;
      search?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const status =
      input.status === undefined || input.status === null || input.status === ''
        ? undefined
        : enumValue(input.status, INVOICE_STATUSES, 'Invoice status', 'DRAFT');

    const search =
      typeof input.search === 'string' ? input.search.trim().slice(0, 100) : undefined;

    const result = await this.repository.listInvoices({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId ? requiredText(input.hostelId, 'hostelId') : undefined,
      studentId: input.studentId ? requiredText(input.studentId, 'studentId') : undefined,
      status,
      search: search || undefined,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getInvoice(tenantId: string, id: unknown) {
    return this.repository.findInvoice({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'invoiceId'),
    });
  }

  async createInvoice(tenantId: string, input: Record<string, unknown>) {
    const discount = input.discount === undefined ? 0 : Number(input.discount);
    if (!Number.isFinite(discount) || discount < 0) {
      throw new Error('Invoice discount cannot be negative');
    }

    const feeAssignmentIds = Array.isArray(input.feeAssignmentIds)
      ? input.feeAssignmentIds.map((id) => requiredText(id, 'feeAssignmentId'))
      : [];

    if (feeAssignmentIds.length === 0) {
      throw new Error('At least one fee assignment is required');
    }

    return this.repository.createInvoice({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      studentId: requiredText(input.studentId, 'studentId'),
      invoiceNumber: requiredText(input.invoiceNumber, 'Invoice number', 100),
      issueDate:
        input.issueDate === undefined
          ? undefined
          : requiredDate(input.issueDate, 'Issue date'),
      dueDate:
        input.dueDate === undefined
          ? undefined
          : requiredDate(input.dueDate, 'Due date'),
      discount: Math.round(discount * 100) / 100,
      notes:
        input.notes === undefined
          ? undefined
          : input.notes === null
            ? null
            : requiredText(input.notes, 'Notes', 1000),
      feeAssignmentIds: Array.from(new Set(feeAssignmentIds)),
    });
  }

  async updateInvoice(tenantId: string, id: unknown, input: Record<string, unknown>) {
    const discount = input.discount === undefined ? undefined : Number(input.discount);
    if (discount !== undefined && (!Number.isFinite(discount) || discount < 0)) {
      throw new Error('Invoice discount cannot be negative');
    }

    return this.repository.updateInvoice({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'invoiceId'),
      invoiceNumber:
        input.invoiceNumber === undefined
          ? undefined
          : requiredText(input.invoiceNumber, 'Invoice number', 100),
      issueDate:
        input.issueDate === undefined
          ? undefined
          : requiredDate(input.issueDate, 'Issue date'),
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate === null
            ? null
            : requiredDate(input.dueDate, 'Due date'),
      discount: discount === undefined ? undefined : Math.round(discount * 100) / 100,
      notes:
        input.notes === undefined
          ? undefined
          : input.notes === null
            ? null
            : requiredText(input.notes, 'Notes', 1000),
    });
  }

  async issueInvoice(tenantId: string, id: unknown) {
    return this.repository.issueInvoice({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'invoiceId'),
    });
  }

  async cancelInvoice(tenantId: string, id: unknown) {
    return this.repository.cancelInvoice({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'invoiceId'),
    });
  }

  async listRooms(
    tenantId: string,
    hostelId: unknown,
    page = 1,
    limit = 25,
    search?: unknown,
  ) {
    return this.repository.findRooms({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(hostelId, 'hostelId'),
      page,
      limit,
      search: typeof search === 'string' ? search : undefined,
    });
  }

  async createRoom(tenantId: string, input: Record<string, unknown>) {
    return this.repository.createRoom({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      roomNumber: requiredText(input.roomNumber, 'Room number', 40),
      capacity: positiveInteger(input.capacity, 'Capacity'),
      sharingType: enumValue(input.sharingType, SHARING_TYPES, 'Sharing type', 'SINGLE'),
    });
  }

  async getRoom(tenantId: string, id: unknown) {
    return this.repository.findRoom({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'roomId'),
    });
  }

  async updateRoom(tenantId: string, id: unknown, input: Record<string, unknown>) {
    return this.repository.updateRoom({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'roomId'),
      roomNumber:
        input.roomNumber === undefined
          ? undefined
          : requiredText(input.roomNumber, 'Room number', 40),
      capacity:
        input.capacity === undefined ? undefined : positiveInteger(input.capacity, 'Capacity'),
      sharingType:
        input.sharingType === undefined
          ? undefined
          : enumValue(input.sharingType, SHARING_TYPES, 'Sharing type', 'SINGLE'),
      status:
        input.status === undefined
          ? undefined
          : enumValue(input.status, ROOM_STATUSES, 'Room status', 'AVAILABLE'),
      isActive: input.isActive === undefined ? undefined : Boolean(input.isActive),
    });
  }

  async deleteRoom(tenantId: string, id: unknown) {
    return this.repository.deleteRoom({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'roomId'),
    });
  }

  async listVacancies(tenantId: string, hostelId: unknown) {
    return this.repository.listVacancies({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(hostelId, 'hostelId'),
    });
  }

  async vacancySummary(tenantId: string, hostelId: unknown) {
    return this.repository.vacancySummary({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(hostelId, 'hostelId'),
    });
  }

  async allocateStudent(tenantId: string, input: Record<string, unknown>, actorId?: string) {
    return this.repository.allocateStudent({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      roomId: requiredText(input.roomId, 'roomId'),
      studentId: requiredText(input.studentId, 'studentId'),
      actorId,
    });
  }

  async deallocateStudent(tenantId: string, input: Record<string, unknown>, actorId?: string) {
    return this.repository.deallocateStudent({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      roomId: requiredText(input.roomId, 'roomId'),
      studentId: requiredText(input.studentId, 'studentId'),
      actorId,
    });
  }

  async autoAllocateStudent(tenantId: string, input: Record<string, unknown>, actorId?: string) {
    return this.repository.autoAllocateStudent({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      studentId: requiredText(input.studentId, 'studentId'),
      actorId,
    });
  }

  async allocationHistory(tenantId: string, roomId: unknown) {
    return this.repository.allocationHistory({
      tenantId: tenantIdValue(tenantId),
      roomId: requiredText(roomId, 'roomId'),
    });
  }

  async recentAllocationActivity(
    tenantId: string,
    hostelId: unknown,
    limit?: unknown,
  ) {
    const parsedLimit =
      typeof limit === 'string' && limit.trim() !== ''
        ? Number(limit)
        : undefined;

    return this.repository.recentAllocationActivity({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(hostelId, 'hostelId'),
      limit:
        parsedLimit !== undefined && Number.isFinite(parsedLimit)
          ? parsedLimit
          : undefined,
    });
  }

  async listStudents(
    tenantId: string,
    input: {
      hostelId?: unknown;
      roomId?: unknown;
      paymentStatus?: unknown;
      status?: unknown;
      search?: unknown;
      userId?: string;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));
    const search = typeof input.search === 'string' ? input.search.trim().slice(0, 100) : undefined;
    const result = await this.repository.listStudents({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId ? requiredText(input.hostelId, 'hostelId') : undefined,
      roomId: input.roomId ? requiredText(input.roomId, 'roomId') : undefined,
      paymentStatus: input.paymentStatus
        ? enumValue(input.paymentStatus, PAYMENT_STATUSES, 'Payment status', 'DUE')
        : undefined,
      status: input.status
        ? enumValue(input.status, STUDENT_STATUSES, 'Student status', 'ACTIVE')
        : undefined,
      search: search || undefined,
      userId: input.userId,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async hostelDashboardSummary(tenantId: string, hostelId?: unknown) {
    return this.repository.hostelDashboardSummary({
      tenantId: tenantIdValue(tenantId),
      hostelId: hostelId ? requiredText(hostelId, 'hostelId') : undefined,
    });
  }

  async getStudent(tenantId: string, id: unknown, userId?: string) {
    return this.repository.findStudent({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'studentId'),
      userId,
    });
  }

  async createStudent(tenantId: string, input: Record<string, unknown>) {
    const email = input.email === undefined ? undefined : requiredText(input.email, 'Email', 160);
    const phone = input.phone === undefined ? undefined : requiredText(input.phone, 'Phone', 40);

    return this.repository.createStudent({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      roomId: input.roomId === undefined ? undefined : requiredText(input.roomId, 'roomId'),
      userId: input.userId === undefined ? undefined : requiredText(input.userId, 'userId'),
      admissionNumber: requiredText(input.admissionNumber, 'Admission number', 80),
      name: requiredText(input.name, 'Student name'),
      email,
      phone,
      dateOfBirth: optionalDate(input.dateOfBirth, 'Date of birth'),
      emergencyName:
        input.emergencyName === undefined
          ? undefined
          : requiredText(input.emergencyName, 'Emergency contact name'),
      emergencyPhone:
        input.emergencyPhone === undefined
          ? undefined
          : requiredText(input.emergencyPhone, 'Emergency contact phone', 40),
      emergencyRelation:
        input.emergencyRelation === undefined
          ? undefined
          : requiredText(input.emergencyRelation, 'Emergency contact relation', 60),
      admissionDate: requiredDate(input.admissionDate, 'Admission date'),
      paymentStatus: enumValue(input.paymentStatus, PAYMENT_STATUSES, 'Payment status', 'DUE'),
      status: enumValue(input.status, STUDENT_STATUSES, 'Student status', 'ACTIVE'),
    });
  }

  async updateStudent(tenantId: string, id: unknown, input: Record<string, unknown>) {
    return this.repository.updateStudent({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'studentId'),
      roomId:
        input.roomId === undefined
          ? undefined
          : input.roomId === null
            ? null
            : requiredText(input.roomId, 'roomId'),
      userId:
        input.userId === undefined
          ? undefined
          : input.userId === null
            ? null
            : requiredText(input.userId, 'userId'),
      admissionNumber:
        input.admissionNumber === undefined
          ? undefined
          : requiredText(input.admissionNumber, 'Admission number', 80),
      name: input.name === undefined ? undefined : requiredText(input.name, 'Student name'),
      email:
        input.email === undefined
          ? undefined
          : input.email === null
            ? null
            : requiredText(input.email, 'Email', 160),
      phone:
        input.phone === undefined
          ? undefined
          : input.phone === null
            ? null
            : requiredText(input.phone, 'Phone', 40),
      dateOfBirth:
        input.dateOfBirth === null ? null : optionalDate(input.dateOfBirth, 'Date of birth'),
      emergencyName:
        input.emergencyName === undefined
          ? undefined
          : input.emergencyName === null
            ? null
            : requiredText(input.emergencyName, 'Emergency contact name'),
      emergencyPhone:
        input.emergencyPhone === undefined
          ? undefined
          : input.emergencyPhone === null
            ? null
            : requiredText(input.emergencyPhone, 'Emergency contact phone', 40),
      emergencyRelation:
        input.emergencyRelation === undefined
          ? undefined
          : input.emergencyRelation === null
            ? null
            : requiredText(input.emergencyRelation, 'Emergency contact relation', 60),
      admissionDate:
        input.admissionDate === undefined
          ? undefined
          : requiredDate(input.admissionDate, 'Admission date'),
      paymentStatus:
        input.paymentStatus === undefined
          ? undefined
          : enumValue(input.paymentStatus, PAYMENT_STATUSES, 'Payment status', 'DUE'),
      status:
        input.status === undefined
          ? undefined
          : enumValue(input.status, STUDENT_STATUSES, 'Student status', 'ACTIVE'),
    });
  }

  async listStaff(tenantId: string, hostelId: unknown) {
    return this.repository.findStaff({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(hostelId, 'hostelId'),
    });
  }

  async listAvailableStaffUsers(tenantId: string) {
    return this.repository.findAvailableStaffUsers(
      tenantIdValue(tenantId),
    );
  }

  async deleteStaffAssignment(
    tenantId: string,
    input: {
      hostelId: unknown;
      assignmentId: unknown;
    },
  ) {
    const hostelId = requiredText(input.hostelId, 'hostelId');
    const assignmentId = requiredText(
      input.assignmentId,
      'assignmentId',
    );

    const result = await this.repository.deleteStaffAssignment({
      tenantId: tenantIdValue(tenantId),
      hostelId,
      assignmentId,
    });

    if (!result || result.count === 0) {
      throw new Error('Staff assignment not found');
    }

    return {
      success: true,
    };
  }

  async updateStaffAssignment(
    tenantId: string,
    input: {
      hostelId: unknown;
      assignmentId: unknown;
      role: unknown;
    },
  ) {
    const hostelId = requiredText(input.hostelId, 'hostelId');
    const assignmentId = requiredText(
      input.assignmentId,
      'assignmentId',
    );

    const role =
      input.role === 'ADMIN' || input.role === 'STAFF'
        ? input.role
        : null;

    if (!role) {
      throw new Error('Role must be ADMIN or STAFF');
    }

    const result = await this.repository.updateStaffAssignment({
      tenantId: tenantIdValue(tenantId),
      hostelId,
      assignmentId,
      role,
    });

    if (!result) {
      throw new Error('Staff assignment not found');
    }

    return result;
  }

  async createStaff(tenantId: string, input: Record<string, unknown>) {
    const role = input.role === 'ADMIN' || input.role === 'STAFF' ? input.role : null;
    if (!role) {
      throw new Error('Role must be ADMIN or STAFF');
    }

    return this.repository.createStaffAssignment({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      userId: requiredText(input.userId, 'userId'),
      role,
    });
  }

  async initiatePayment(tenantId: string, input: Record<string, unknown>) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payment amount must be positive');
    return this.repository.initiatePayment({
      tenantId: tenantIdValue(tenantId),
      studentId: requiredText(input.studentId, 'studentId'),
      studentUserId: typeof input.studentUserId === 'string' ? input.studentUserId : undefined,
      amount: Math.round(amount * 100) / 100,
    });
  }

  async listPayments(
    tenantId: string,
    input: {
      studentId?: string;
      studentUserId?: string;
      status?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const status =
      input.status === undefined || input.status === ''
        ? undefined
        : enumValue(
            input.status,
            [
              'INITIATED',
              'PENDING',
              'SUBMITTED',
              'VERIFYING',
              'PAID',
              'FAILED',
              'REJECTED',
              'REFUNDED',
            ] as const,
            'Payment status',
            'INITIATED',
          );
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));
    const result = await this.repository.listPayments({
      tenantId: tenantIdValue(tenantId),
      studentId: input.studentId,
      studentUserId: input.studentUserId,
      status,
      page,
      limit,
    });
    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getPayment(tenantId: string, id: unknown, studentId?: string, studentUserId?: string) {
    return this.repository.findPayment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'paymentId'),
      studentId,
      studentUserId,
    });
  }

  async submitPayment(
    tenantId: string,
    id: unknown,
    input: Record<string, unknown>,
    studentId?: string,
    studentUserId?: string,
  ) {
    const idempotencyKey = requiredText(input.idempotencyKey, 'Idempotency key', 160);
    return this.repository.submitPayment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'paymentId'),
      studentId,
      studentUserId,
      utr: requiredText(input.utr, 'UTR', 120),
      transactionReferenceId:
        input.transactionReferenceId === undefined
          ? undefined
          : requiredText(input.transactionReferenceId, 'Transaction reference', 160),
      proofUrl:
        input.proofUrl === undefined ? undefined : requiredText(input.proofUrl, 'Proof URL', 500),
      idempotencyKey,
    });
  }

  async verifyPayment(
    tenantId: string,
    id: unknown,
    input: Record<string, unknown>,
    actorId: string,
  ) {
    return this.repository.verifyPayment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'paymentId'),
      actorId,
      idempotencyKey: requiredText(input.idempotencyKey, 'Idempotency key', 160),
    });
  }

  async rejectPayment(
    tenantId: string,
    id: unknown,
    input: Record<string, unknown>,
    actorId: string,
  ) {
    return this.repository.rejectPayment({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'paymentId'),
      actorId,
      reason: requiredText(input.reason, 'Rejection reason', 500),
      idempotencyKey: requiredText(input.idempotencyKey, 'Idempotency key', 160),
    });
  }

  async listReceipts(
    tenantId: string,
    input: {
      studentId?: string;
      studentUserId?: string;
      paymentId?: string;
      search?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));
    const search =
      typeof input.search === 'string' ? input.search.trim().slice(0, 100) : undefined;

    const result = await this.repository.listReceipts({
      tenantId: tenantIdValue(tenantId),
      studentId: input.studentId,
      studentUserId: input.studentUserId,
      paymentId: input.paymentId,
      search: search || undefined,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getReceipt(tenantId: string, id: unknown, studentUserId?: string) {
    return this.repository.findReceipt({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'receiptId'),
      studentUserId,
    });
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  async getFeeCollectionSummary(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      from?: unknown;
      to?: unknown;
    } = {},
  ) {
    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    return this.repository.getFeeCollectionSummary({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,
      from,
      to,
    });
  }

  async listStudentOutstandingReport(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const result = await this.repository.listStudentOutstandingReport({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async listInvoiceReport(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      status?: unknown;
      from?: unknown;
      to?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const status =
      input.status === undefined ||
      input.status === null ||
      input.status === ''
        ? undefined
        : enumValue(
            input.status,
            INVOICE_STATUSES,
            'Invoice status',
            'DRAFT',
          );

    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    const result = await this.repository.listInvoiceReport({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,
      status,
      from,
      to,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async listPaymentReport(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      status?: unknown;
      from?: unknown;
      to?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const status =
      input.status === undefined ||
      input.status === null ||
      input.status === ''
        ? undefined
        : enumValue(
            input.status,
            [
              'INITIATED',
              'PENDING',
              'SUBMITTED',
              'VERIFYING',
              'PAID',
              'FAILED',
              'REJECTED',
              'REFUNDED',
            ] as const,
            'Payment status',
            'INITIATED',
          );

    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    const result = await this.repository.listPaymentReport({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,
      status,
      from,
      to,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async listReceiptReport(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      from?: unknown;
      to?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    const result = await this.repository.listReceiptReport({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,
      from,
      to,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Reconciliation
  // ---------------------------------------------------------------------------

  async listPaymentReconciliation(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      from?: unknown;
      to?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    const result = await this.repository.listPaymentReconciliation({
      tenantId: tenantIdValue(tenantId),

      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,

      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,

      from,
      to,
      page,
      limit,
    });

    return {
      items: result.items,

      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }
  // ---------------------------------------------------------------------------
  // Deposits
  // ---------------------------------------------------------------------------

  async listDeposits(
    tenantId: string,
    input: {
      hostelId?: unknown;
      status?: unknown;
      from?: unknown;
      to?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const status =
      input.status === undefined || input.status === null || input.status === ''
        ? undefined
        : enumValue(
            input.status,
            DEPOSIT_STATUSES,
            'Deposit status',
            'PENDING',
          );

    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    const result = await this.repository.listDeposits({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      status,
      from,
      to,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getDeposit(tenantId: string, id: unknown) {
    return this.repository.findDeposit({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'depositId'),
    });
  }

  async createDeposit(
    tenantId: string,
    input: Record<string, unknown>,
    actorId?: string,
  ) {
    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    const depositDate =
      input.depositDate === undefined
        ? undefined
        : requiredDate(input.depositDate, 'Deposit date');

    const paymentMethod = enumValue(
      input.paymentMethod,
      PAYMENT_METHODS,
      'Payment method',
      'UPI',
    );

    return this.repository.createDeposit({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      amount: Math.round(amount * 100) / 100,
      currency:
        input.currency === undefined
          ? undefined
          : requiredText(input.currency, 'Currency', 10),
      depositDate,
      paymentMethod,
      reference:
        input.reference === undefined
          ? undefined
          : requiredText(input.reference, 'Reference number', 160),
      depositedBy:
        input.depositedBy === undefined
          ? actorId
          : requiredText(input.depositedBy, 'Deposited by', 160),
      notes:
        input.notes === undefined
          ? undefined
          : input.notes === null
            ? null
            : requiredText(input.notes, 'Notes', 1000),
    });
  }

  async updateDeposit(
    tenantId: string,
    id: unknown,
    input: Record<string, unknown>,
  ) {
    const amount = input.amount === undefined ? undefined : Number(input.amount);

    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      throw new Error('Deposit amount must be positive');
    }

    const depositDate =
      input.depositDate === undefined
        ? undefined
        : requiredDate(input.depositDate, 'Deposit date');

    return this.repository.updateDeposit({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'depositId'),
      amount:
        amount === undefined ? undefined : Math.round(amount * 100) / 100,
      currency:
        input.currency === undefined
          ? undefined
          : requiredText(input.currency, 'Currency', 10),
      depositDate,
      paymentMethod:
        input.paymentMethod === undefined
          ? undefined
          : enumValue(
              input.paymentMethod,
              PAYMENT_METHODS,
              'Payment method',
              'UPI',
            ),
      reference:
        input.reference === undefined
          ? undefined
          : input.reference === null
            ? null
            : requiredText(input.reference, 'Reference number', 160),
      depositedBy:
        input.depositedBy === undefined
          ? undefined
          : input.depositedBy === null
            ? null
            : requiredText(input.depositedBy, 'Deposited by', 160),
      notes:
        input.notes === undefined
          ? undefined
          : input.notes === null
            ? null
            : requiredText(input.notes, 'Notes', 1000),
    });
  }

  async reconcileDeposit(tenantId: string, id: unknown) {
    return this.repository.reconcileDeposit({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'depositId'),
    });
  }

  async cancelDeposit(tenantId: string, id: unknown) {
    return this.repository.cancelDeposit({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'depositId'),
    });
  }

  // ---------------------------------------------------------------------------
  // Ledger
  // ---------------------------------------------------------------------------

  async listLedgerEntries(
    tenantId: string,
    input: {
      hostelId?: unknown;
      type?: unknown;
      direction?: unknown;
      from?: unknown;
      to?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const type =
      input.type === undefined || input.type === null || input.type === ''
        ? undefined
        : enumValue(
            input.type,
            LEDGER_ENTRY_TYPES,
            'Ledger entry type',
            'OTHER',
          );

    const direction =
      input.direction === undefined ||
      input.direction === null ||
      input.direction === ''
        ? undefined
        : enumValue(
            input.direction,
            LEDGER_DIRECTIONS,
            'Ledger direction',
            'CREDIT',
          );

    const from = optionalDate(input.from, 'From date');
    const to = optionalDate(input.to, 'To date');

    if (from && to && to < from) {
      throw new Error('To date cannot be before from date');
    }

    const result = await this.repository.listLedgerEntries({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      type,
      direction,
      from,
      to,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getLedgerEntry(tenantId: string, id: unknown) {
    return this.repository.findLedgerEntry({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'ledgerEntryId'),
    });
  }

  async createLedgerEntry(
    tenantId: string,
    input: Record<string, unknown>,
    actorId?: string,
  ) {
    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Ledger amount must be positive');
    }

    return this.repository.createLedgerEntry({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      entryDate:
        input.entryDate === undefined
          ? undefined
          : requiredDate(input.entryDate, 'Entry date'),
      type: enumValue(
        input.type,
        LEDGER_ENTRY_TYPES,
        'Ledger entry type',
        'OTHER',
      ),
      direction: enumValue(
        input.direction,
        LEDGER_DIRECTIONS,
        'Ledger direction',
        'CREDIT',
      ),
      amount: Math.round(amount * 100) / 100,
      currency:
        input.currency === undefined
          ? undefined
          : requiredText(input.currency, 'Currency', 10),
      referenceType:
        input.referenceType === undefined
          ? undefined
          : requiredText(input.referenceType, 'Reference type', 80),
      referenceId:
        input.referenceId === undefined
          ? undefined
          : requiredText(input.referenceId, 'Reference ID', 160),
      description: requiredText(input.description, 'Description', 1000),
      createdBy:
        input.createdBy === undefined
          ? actorId
          : requiredText(input.createdBy, 'Created by', 160),
    });
  }

  // ---------------------------------------------------------------------------
  // Complaints
  // ---------------------------------------------------------------------------

  async listComplaints(
    tenantId: string,
    input: {
      hostelId?: unknown;
      studentId?: unknown;
      status?: unknown;
      priority?: unknown;
      assignedTo?: unknown;
      search?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const status =
      input.status === undefined || input.status === null || input.status === ''
        ? undefined
        : enumValue(
            input.status,
            COMPLAINT_STATUSES,
            'Complaint status',
            'OPEN',
          );

    const priority =
      input.priority === undefined ||
      input.priority === null ||
      input.priority === ''
        ? undefined
        : enumValue(
            input.priority,
            COMPLAINT_PRIORITIES,
            'Complaint priority',
            'MEDIUM',
          );

    const assignedTo =
      input.assignedTo === undefined
        ? undefined
        : requiredText(input.assignedTo, 'assignedTo', 160);

    const search =
      typeof input.search === 'string'
        ? input.search.trim().slice(0, 100)
        : undefined;

    const result = await this.repository.listComplaints({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      studentId: input.studentId
        ? requiredText(input.studentId, 'studentId')
        : undefined,
      status,
      priority,
      assignedTo,
      search: search || undefined,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getComplaint(tenantId: string, id: unknown) {
    return this.repository.findComplaint({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'complaintId'),
    });
  }

  async createComplaint(
    tenantId: string,
    input: Record<string, unknown>,
  ) {
    return this.repository.createComplaint({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      studentId:
        input.studentId === undefined
          ? undefined
          : requiredText(input.studentId, 'studentId'),
      subject: requiredText(input.subject, 'Subject', 200),
      description: requiredText(input.description, 'Description', 2000),
      priority: enumValue(
        input.priority,
        COMPLAINT_PRIORITIES,
        'Complaint priority',
        'MEDIUM',
      ),
      assignedTo:
        input.assignedTo === undefined
          ? undefined
          : requiredText(input.assignedTo, 'assignedTo', 160),
    });
  }

  async updateComplaint(
    tenantId: string,
    id: unknown,
    input: Record<string, unknown>,
  ) {
    const status =
      input.status === undefined
        ? undefined
        : enumValue(
            input.status,
            COMPLAINT_STATUSES,
            'Complaint status',
            'OPEN',
          );

    const priority =
      input.priority === undefined
        ? undefined
        : enumValue(
            input.priority,
            COMPLAINT_PRIORITIES,
            'Complaint priority',
            'MEDIUM',
          );

    const resolvedAt =
      input.resolvedAt === undefined
        ? undefined
        : input.resolvedAt === null
          ? null
          : requiredDate(input.resolvedAt, 'Resolved date');

    if (
      (status === 'RESOLVED' || status === 'CLOSED') &&
      resolvedAt === undefined
    ) {
      // The repository can preserve an existing resolution timestamp when
      // status changes without an explicit date, so leave this field unset.
    }

    return this.repository.updateComplaint({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'complaintId'),
      subject:
        input.subject === undefined
          ? undefined
          : requiredText(input.subject, 'Subject', 200),
      description:
        input.description === undefined
          ? undefined
          : requiredText(input.description, 'Description', 2000),
      priority,
      status,
      assignedTo:
        input.assignedTo === undefined
          ? undefined
          : input.assignedTo === null
            ? null
            : requiredText(input.assignedTo, 'assignedTo', 160),
      resolution:
        input.resolution === undefined
          ? undefined
          : input.resolution === null
            ? null
            : requiredText(input.resolution, 'Resolution', 2000),
      resolvedAt,
    });
  }

  // ---------------------------------------------------------------------------
  // Announcements
  // ---------------------------------------------------------------------------

  async listAnnouncements(
    tenantId: string,
    input: {
      hostelId?: unknown;
      audience?: unknown;
      status?: unknown;
      search?: unknown;
      page: number;
      limit: number;
    },
  ) {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));

    const audience =
      input.audience === undefined ||
      input.audience === null ||
      input.audience === ''
        ? undefined
        : enumValue(
            input.audience,
            ANNOUNCEMENT_AUDIENCES,
            'Announcement audience',
            'ALL',
          );

    const status =
      input.status === undefined || input.status === null || input.status === ''
        ? undefined
        : enumValue(
            input.status,
            ANNOUNCEMENT_STATUSES,
            'Announcement status',
            'DRAFT',
          );

    const search =
      typeof input.search === 'string'
        ? input.search.trim().slice(0, 100)
        : undefined;

    const result = await this.repository.listAnnouncements({
      tenantId: tenantIdValue(tenantId),
      hostelId: input.hostelId
        ? requiredText(input.hostelId, 'hostelId')
        : undefined,
      audience,
      status,
      search: search || undefined,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }

  async getAnnouncement(tenantId: string, id: unknown) {
    return this.repository.findAnnouncement({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'announcementId'),
    });
  }

  async createAnnouncement(
    tenantId: string,
    input: Record<string, unknown>,
    actorId?: string,
  ) {
    const publishAt =
      input.publishAt === undefined
        ? undefined
        : input.publishAt === null
          ? null
          : requiredDate(input.publishAt, 'Publish date');

    const expiresAt =
      input.expiresAt === undefined
        ? undefined
        : input.expiresAt === null
          ? null
          : requiredDate(input.expiresAt, 'Expiry date');

    if (publishAt && expiresAt && expiresAt < publishAt) {
      throw new Error('Announcement expiry cannot be before publish date');
    }

    return this.repository.createAnnouncement({
      tenantId: tenantIdValue(tenantId),
      hostelId: requiredText(input.hostelId, 'hostelId'),
      title: requiredText(input.title, 'Title', 200),
      message: requiredText(input.message, 'Message', 5000),
      audience: enumValue(
        input.audience,
        ANNOUNCEMENT_AUDIENCES,
        'Announcement audience',
        'ALL',
      ),
      publishAt,
      expiresAt,
      createdBy:
        input.createdBy === undefined
          ? actorId
          : requiredText(input.createdBy, 'Created by', 160),
    });
  }

  async updateAnnouncement(
    tenantId: string,
    id: unknown,
    input: Record<string, unknown>,
  ) {
    const publishAt =
      input.publishAt === undefined
        ? undefined
        : input.publishAt === null
          ? null
          : requiredDate(input.publishAt, 'Publish date');

    const expiresAt =
      input.expiresAt === undefined
        ? undefined
        : input.expiresAt === null
          ? null
          : requiredDate(input.expiresAt, 'Expiry date');

    if (publishAt && expiresAt && expiresAt < publishAt) {
      throw new Error('Announcement expiry cannot be before publish date');
    }

    return this.repository.updateAnnouncement({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'announcementId'),
      hostelId:
        input.hostelId === undefined
          ? undefined
          : requiredText(input.hostelId, 'hostelId'),
      title:
        input.title === undefined
          ? undefined
          : requiredText(input.title, 'Title', 200),
      message:
        input.message === undefined
          ? undefined
          : requiredText(input.message, 'Message', 5000),
      audience:
        input.audience === undefined
          ? undefined
          : enumValue(
              input.audience,
              ANNOUNCEMENT_AUDIENCES,
              'Announcement audience',
              'ALL',
            ),
      publishAt,
      expiresAt,
      status:
        input.status === undefined
          ? undefined
          : enumValue(
              input.status,
              ANNOUNCEMENT_STATUSES,
              'Announcement status',
              'DRAFT',
            ),
    });
  }

  async publishAnnouncement(tenantId: string, id: unknown) {
    return this.repository.publishAnnouncement({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'announcementId'),
    });
  }

  async archiveAnnouncement(tenantId: string, id: unknown) {
    return this.repository.archiveAnnouncement({
      tenantId: tenantIdValue(tenantId),
      id: requiredText(id, 'announcementId'),
    });
  }

}
