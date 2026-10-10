import { prisma } from '@saas/database';
import { JwtService } from '../../../auth/infrastructure/jwt.service';
import { verifyPassword, hashPassword } from '../../../auth/infrastructure/password.service';

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

// ------------------------------------------------------------
// Change Passkey Input
// ------------------------------------------------------------

export type StudentChangePasskeyInput = {
  userId: string;
  currentPasskey: string;
  newPasskey: string;
  confirmPasskey: string;
};

const jwtService = new JwtService();

export class StudentLoginUseCase {
  // ============================================================
  // STUDENT LOGIN
  // ============================================================

  async execute(input: StudentLoginInput): Promise<StudentLoginResult> {
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
      throw new Error('Student ID or registered mobile number is required');
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
        studentAccount: {
          select: {
            id: true,
            passwordHash: true,
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
      studentAccountId: student?.studentAccount?.id,
      studentAccountActive: student?.studentAccount?.isActive,
    });

    // ------------------------------------------------------------
    // Student account validation
    // ------------------------------------------------------------

    if (!student) {
      throw new Error('Invalid Student ID or registered mobile number');
    }

    if (!student.studentAccount) {
      throw new Error('Student account is not configured for login');
    }

    if (!student.studentAccount.isActive) {
      throw new Error('Student account is inactive');
    }

    // ------------------------------------------------------------
    // Verify passkey
    // ------------------------------------------------------------

    const passkeyValid = verifyPassword(passkey, student.studentAccount.passwordHash);

    if (!passkeyValid) {
      throw new Error('Invalid passkey');
    }

    // ------------------------------------------------------------
    // Generate JWT
    // ------------------------------------------------------------

    const token = jwtService.sign({
      userId: student.studentAccount.id,
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

  // ============================================================
  // CHANGE STUDENT PASSKEY
  // ============================================================

  async changePasskey(
    input: StudentChangePasskeyInput,
  ): Promise<{ success: boolean; message: string }> {
    const userId = input.userId.trim();
    const currentPasskey = input.currentPasskey;
    const newPasskey = input.newPasskey;
    const confirmPasskey = input.confirmPasskey;

    // ------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------

    if (!userId) {
      throw new Error('Student authentication is required');
    }

    if (!currentPasskey) {
      throw new Error('Current passkey is required');
    }

    if (!newPasskey) {
      throw new Error('New passkey is required');
    }

    if (!confirmPasskey) {
      throw new Error('Please confirm your new passkey');
    }

    if (newPasskey !== confirmPasskey) {
      throw new Error('New passkey and confirm passkey do not match');
    }

    if (newPasskey.length < 6) {
      throw new Error('New passkey must be at least 6 characters');
    }

    if (currentPasskey === newPasskey) {
      throw new Error('New passkey must be different from the current passkey');
    }

    // ------------------------------------------------------------
    // Find student account
    // ------------------------------------------------------------

    const studentAccount = await prisma.studentAccount.findFirst({
      where: {
        id: userId,
        isActive: true,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!studentAccount) {
      throw new Error('Student account not found or inactive');
    }

    // ------------------------------------------------------------
    // Verify current passkey
    // ------------------------------------------------------------

    const currentPasskeyValid = verifyPassword(currentPasskey, studentAccount.passwordHash);

    if (!currentPasskeyValid) {
      throw new Error('Current passkey is incorrect');
    }

    // ------------------------------------------------------------
    // Hash new passkey
    // ------------------------------------------------------------

    const newPasswordHash = hashPassword(newPasskey);

    // ------------------------------------------------------------
    // Update student passkey
    // ------------------------------------------------------------

    await prisma.studentAccount.update({
      where: {
        id: studentAccount.id,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // ------------------------------------------------------------
    // Success
    // ------------------------------------------------------------

    return {
      success: true,
      message: 'Passkey changed successfully',
    };
  }
}
