import { prisma, Prisma } from '@saas/database';

export type HostelRepository = {
  findHostels(tenantId: string): Promise<unknown[]>;
  createHostel(input: { tenantId: string; name: string }): Promise<unknown>;
  findRooms(input: { tenantId: string; hostelId: string }): Promise<unknown[]>;
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
  allocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  deallocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  autoAllocateStudent(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    actorId?: string;
  }): Promise<unknown>;
  allocationHistory(input: { tenantId: string; roomId: string }): Promise<unknown[]>;
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
  findStudent(input: { tenantId: string; id: string; userId?: string }): Promise<unknown | null>;
  createStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId?: string;
    userId?: string;
    admissionNumber: string;
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    admissionDate?: Date;
    paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
    status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'ARCHIVED';
  }): Promise<unknown>;
  updateStudent(input: {
    tenantId: string;
    id: string;
    roomId?: string | null;
    userId?: string | null;
    admissionNumber?: string;
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
};

export class HostelPropertyPrismaRepository implements HostelRepository {
  findHostels(tenantId: string) {
    return prisma.hostel.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  createHostel(input: { tenantId: string; name: string }) {
    return prisma.hostel.create({
      data: {
        name: input.name,
        tenant: { connect: { id: input.tenantId } },
      },
    });
  }

  findRooms(input: { tenantId: string; hostelId: string }) {
    return prisma.room.findMany({
      where: { tenantId: input.tenantId, hostelId: input.hostelId },
      orderBy: { roomNumber: 'asc' },
    });
  }

  createRoom(input: {
    tenantId: string;
    hostelId: string;
    roomNumber: string;
    capacity: number;
    sharingType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'DORMITORY';
  }) {
    return prisma.room.create({
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

      return tx.room.update({
        where: { id: input.id },
        data: { ...input, tenantId: undefined, vacancyStatus },
      });
    });
  }

  async deleteRoom(input: { tenantId: string; id: string }) {
    const room = await prisma.room.findFirst({ where: { id: input.id, tenantId: input.tenantId } });
    if (!room) throw new Error('Room not found');
    if (room.occupancy > 0) throw new Error('Cannot deactivate an occupied room');

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
    });
  }

  async vacancySummary(input: { tenantId: string; hostelId: string }) {
    const rooms = await prisma.room.findMany({ where: input });
    return rooms.reduce(
      (summary, room) => {
        summary.rooms += 1;
        summary.capacity += room.capacity;
        summary.occupancy += room.occupancy;
        summary.vacancy += Math.max(0, room.capacity - room.occupancy);
        if (room.vacancyStatus === 'FULL') summary.full += 1;
        if (room.vacancyStatus === 'VACANT') summary.vacant += 1;
        if (room.vacancyStatus === 'PARTIALLY_OCCUPIED') summary.partial += 1;
        return summary;
      },
      { rooms: 0, capacity: 0, occupancy: 0, vacancy: 0, full: 0, vacant: 0, partial: 0 },
    );
  }

  private async withAllocationRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(operation, { isolationLevel: 'Serializable' });
      } catch (error: unknown) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        if (code !== 'P2034' || attempt === 2) throw error;
      }
    }
    throw new Error('Allocation transaction failed');
  }

  allocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
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
      if (room.occupancy >= room.capacity) throw new Error('Room capacity is full');

      const student = await tx.student.findFirst({
        where: { id: input.studentId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!student) throw new Error('Student not found');
      if (student.roomId) throw new Error('Student is already allocated');

      const studentUpdate = await tx.student.updateMany({
        where: { id: input.studentId, tenantId: input.tenantId, roomId: null },
        data: { roomId: input.roomId },
      });
      if (studentUpdate.count !== 1) throw new Error('Student is already allocated');
      const nextOccupancy = room.occupancy + 1;
      await tx.room.update({
        where: { id: room.id },
        data: {
          occupancy: nextOccupancy,
          vacancyStatus: nextOccupancy >= room.capacity ? 'FULL' : 'PARTIALLY_OCCUPIED',
        },
      });
      return tx.roomAllocation.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          studentId: input.studentId,
          actorId: input.actorId,
          action: 'ALLOCATED',
        },
      });
    });
  }

  deallocateStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId: string;
    studentId: string;
    actorId?: string;
  }) {
    return this.withAllocationRetry(async (tx) => {
      const room = await tx.room.findFirst({
        where: { id: input.roomId, tenantId: input.tenantId, hostelId: input.hostelId },
      });
      if (!room) throw new Error('Room not found');
      const updated = await tx.student.updateMany({
        where: {
          id: input.studentId,
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
        },
        data: { roomId: null },
      });
      if (updated.count !== 1) throw new Error('Student is not allocated to this room');
      const nextOccupancy = Math.max(0, room.occupancy - 1);
      await tx.room.update({
        where: { id: room.id },
        data: {
          occupancy: nextOccupancy,
          vacancyStatus: nextOccupancy === 0 ? 'VACANT' : 'PARTIALLY_OCCUPIED',
        },
      });
      return tx.roomAllocation.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomId: input.roomId,
          studentId: input.studentId,
          actorId: input.actorId,
          action: 'DEALLOCATED',
        },
      });
    });
  }

  async autoAllocateStudent(input: {
    tenantId: string;
    hostelId: string;
    studentId: string;
    actorId?: string;
  }) {
    const rooms = await prisma.room.findMany({
      where: {
        tenantId: input.tenantId,
        hostelId: input.hostelId,
        isActive: true,
        status: 'AVAILABLE',
        occupancy: { lt: 999999 },
      },
      orderBy: [{ occupancy: 'asc' }, { roomNumber: 'asc' }],
    });
    for (const room of rooms) {
      try {
        return await this.allocateStudent({ ...input, roomId: room.id });
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
      ...(input.userId ? { userId: input.userId } : {}),
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
        include: { room: { select: { id: true, roomNumber: true } } },
        orderBy: { name: 'asc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.student.count({ where }),
    ]);

    return { items, total };
  }

  findStudent(input: { tenantId: string; id: string; userId?: string }) {
    return prisma.student.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        ...(input.userId ? { userId: input.userId } : {}),
      },
      include: {
        hostel: { select: { id: true, name: true } },
        room: { select: { id: true, roomNumber: true } },
      },
    });
  }

  createStudent(input: {
    tenantId: string;
    hostelId: string;
    roomId?: string;
    userId?: string;
    admissionNumber: string;
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    admissionDate?: Date;
    paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
    status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'ARCHIVED';
  }) {
    return prisma.student.create({
      data: {
        admissionNumber: input.admissionNumber,
        name: input.name,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        emergencyName: input.emergencyName,
        emergencyPhone: input.emergencyPhone,
        emergencyRelation: input.emergencyRelation,
        admissionDate: input.admissionDate,
        paymentStatus: input.paymentStatus,
        status: input.status,
        tenant: { connect: { id: input.tenantId } },
        hostel: {
          connect: { id_tenantId: { id: input.hostelId, tenantId: input.tenantId } },
        },
        ...(input.roomId
          ? {
              room: {
                connect: { id_tenantId: { id: input.roomId, tenantId: input.tenantId } },
              },
            }
          : {}),
        ...(input.userId
          ? {
              user: {
                connect: { id_tenantId: { id: input.userId, tenantId: input.tenantId } },
              },
            }
          : {}),
      },
    });
  }

  updateStudent(input: {
    tenantId: string;
    id: string;
    roomId?: string | null;
    userId?: string | null;
    admissionNumber?: string;
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
    const existing = prisma.student.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
      select: { id: true },
    });

    const { tenantId, id, roomId, userId, ...data } = input;

    return existing.then((found) => {
      if (!found) throw new Error('Student not found');

      return prisma.student.update({
        where: { id },
        data: {
          ...data,
          ...(roomId === undefined
            ? {}
            : roomId === null
              ? { room: { disconnect: true } }
              : { room: { connect: { id_tenantId: { id: roomId, tenantId } } } }),
          ...(userId === undefined
            ? {}
            : userId === null
              ? { user: { disconnect: true } }
              : { user: { connect: { id_tenantId: { id: userId, tenantId } } } }),
        },
      });
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
        ...(input.studentUserId ? { userId: input.studentUserId } : {}),
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
      ...(input.studentUserId ? { student: { userId: input.studentUserId } } : {}),
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
        ...(input.studentUserId ? { student: { userId: input.studentUserId } } : {}),
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
          ...(input.studentUserId ? { student: { userId: input.studentUserId } } : {}),
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
      if (payment.verifyIdempotencyKey === input.idempotencyKey && payment.receipt) return payment;
      if (!['SUBMITTED', 'VERIFYING'].includes(payment.status))
        throw new Error('Payment must be submitted before verification');
      if (payment.amount.gt(payment.student.outstandingAmount))
        throw new Error('Payment exceeds the current outstanding amount');

      await tx.payment.update({ where: { id: payment.id }, data: { status: 'VERIFYING' } });
      const remaining = payment.student.outstandingAmount.sub(payment.amount);
      const receipt = await tx.paymentReceipt.create({
        data: {
          tenantId: input.tenantId,
          paymentId: payment.id,
          receiptNumber: `RL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          metadata: { verifiedBy: input.actorId },
        },
      });
      await tx.student.update({
        where: { id: payment.studentId },
        data: {
          outstandingAmount: { decrement: payment.amount },
          paymentStatus: remaining.gt(0) ? 'PARTIAL' : 'PAID',
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
        include: { receipt: true },
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
}
