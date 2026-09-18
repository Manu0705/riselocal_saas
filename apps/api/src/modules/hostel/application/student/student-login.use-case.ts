import { prisma } from '@saas/database';
import { normalizeAuthRole } from '@saas/domain-core/auth.contract';
import { JwtService } from '../../../auth/infrastructure/jwt.service';
import { verifyPassword } from '../../../auth/infrastructure/password.service';

export type StudentLoginInput = {
  tenantSlug: string;
  identifier: string;
  passkey: string;
};

export type StudentLoginResult = {
  token: string;
  student: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    admissionNumber: string;
    hostelId: string;
    roomId: string | null;
  };
};

const jwtService = new JwtService();

export class StudentLoginUseCase {
  async execute(
    input: StudentLoginInput,
  ): Promise<StudentLoginResult> {
    const tenantSlug = input.tenantSlug.trim().toLowerCase();
    const identifier = input.identifier.trim();
    const passkey = input.passkey;

    // ------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------

    if (!tenantSlug) {
      throw new Error('Hostel information is required');
    }

    if (!identifier) {
      throw new Error(
        'Student ID or registered mobile number is required',
      );
    }

    if (!passkey) {
      throw new Error('Passkey is required');
    }

    // ------------------------------------------------------------
    // Find tenant
    // ------------------------------------------------------------

    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: tenantSlug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (!tenant) {
      throw new Error('Hostel tenant not found');
    }

    // ------------------------------------------------------------
    // Find student
    //
    // Student ID        -> admissionNumber
    // Registered mobile -> phone
    // ------------------------------------------------------------

    const student = await prisma.student.findFirst({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',

        OR: [
          {
            admissionNumber: identifier,
          },
          {
            phone: identifier,
          },
        ],
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    console.log('STUDENT LOGIN DEBUG', {
  tenantSlug,
  identifier,
  tenantId: tenant.id,
  studentFound: !!student,
  studentId: student?.id,
  studentPhone: student?.phone,
  studentStatus: student?.status,
  userId: student?.user?.id,
  userRole: student?.user?.role,
  userActive: student?.user?.isActive,
});

    // ------------------------------------------------------------
    // Student account validation
    // ------------------------------------------------------------

    if (!student) {
      throw new Error(
        'Invalid Student ID or registered mobile number',
      );
    }

    if (!student.user) {
      throw new Error(
        'Student account is not configured for login',
      );
    }

    if (!student.user.isActive) {
      throw new Error('Student account is inactive');
    }

    // ------------------------------------------------------------
    // Make sure this is actually a student account
    // ------------------------------------------------------------

    const role = normalizeAuthRole(
      student.user.role,
      'student',
    );

    if (role !== 'student') {
      throw new Error(
        'This account is not a student account',
      );
    }

    // ------------------------------------------------------------
    // Verify passkey
    // ------------------------------------------------------------

    const passkeyValid = verifyPassword(
      passkey,
      student.user.passwordHash,
    );

    if (!passkeyValid) {
      throw new Error('Invalid passkey');
    }

    // ------------------------------------------------------------
    // Generate JWT
    // ------------------------------------------------------------

    const token = jwtService.sign({
      sub: student.user.id,
      tenantId: tenant.id,
      role: 'student',
    });

    // ------------------------------------------------------------
    // Return student session
    // ------------------------------------------------------------

    return {
      token,

      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        admissionNumber: student.admissionNumber,
        hostelId: student.hostelId,
        roomId: student.roomId,
      },
    };
  }
}