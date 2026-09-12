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
}
