import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const SCRYPT_KEYLEN = 64;

const DEVELOPMENT_TENANT = {
  name: 'Demo Business',
  slug: 'demo',
};

const DEVELOPMENT_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@demo.local',
  password: 'DemoAdmin@123',
  role: 'owner' as const,
};

const DEVELOPMENT_STUDENT = {
  name: 'stu_01',
  email: 'student01@demo.local',
  password: 'Student@123',
  phone: '8247430162',
  admissionNumber: 'admission_001',
  role: 'student' as const,
};

const FIRST_TENANT_STUDENT = {
  name: 'Manu',
  email: 'student0897@first-tenant.local',
  password: 'Manu@2026',
  admissionNumber: '0897',
  role: 'student' as const,
};

function hashPassword(plainText: string): string {
  const normalized = plainText.trim();
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalized, salt, SCRYPT_KEYLEN).toString('hex');

  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding development database...');

  // ------------------------------------------------------------
  // Development tenant
  // ------------------------------------------------------------

  const tenant = await prisma.tenant.upsert({
    where: {
      slug: DEVELOPMENT_TENANT.slug,
    },
    update: {},
    create: {
      name: DEVELOPMENT_TENANT.name,
      slug: DEVELOPMENT_TENANT.slug,
      domain: null,
    },
  });

  console.log(`✓ Tenant "${tenant.name}" ready`);

  // ------------------------------------------------------------
  // Development admin
  // ------------------------------------------------------------

  const existingAdmin = await prisma.tenantUser.findFirst({
    where: {
      tenantId: tenant.id,
      email: DEVELOPMENT_ADMIN.email,
    },
  });

  if (existingAdmin) {
    console.log(`✓ User "${DEVELOPMENT_ADMIN.email}" already exists`);
  } else {
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        name: DEVELOPMENT_ADMIN.name,
        email: DEVELOPMENT_ADMIN.email,
        passwordHash: hashPassword(DEVELOPMENT_ADMIN.password),
        role: DEVELOPMENT_ADMIN.role,
        isActive: true,
      },
    });

    console.log(`✓ Created user "${DEVELOPMENT_ADMIN.email}"`);
  }

  // ------------------------------------------------------------
  // Development student
  // ------------------------------------------------------------

  const student = await prisma.student.findFirst({
    where: {
      tenantId: tenant.id,
      admissionNumber: DEVELOPMENT_STUDENT.admissionNumber,
    },
  });

  if (!student) {
    console.log(`⚠ Student "${DEVELOPMENT_STUDENT.admissionNumber}" not found.`);

    console.log('Create the student first, then run the seed again.');

    return;
  }

  console.log(`✓ Student "${student.admissionNumber}" found`);

  // ------------------------------------------------------------
  // Create / update student login account
  // ------------------------------------------------------------

  const studentAccount = await prisma.studentAccount.upsert({
    where: {
      studentId_tenantId: {
        studentId: student.id,
        tenantId: tenant.id,
      },
    },
    update: {
      passwordHash: hashPassword(DEVELOPMENT_STUDENT.password),
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      studentId: student.id,
      passwordHash: hashPassword(DEVELOPMENT_STUDENT.password),
      isActive: true,
    },
  });

  await prisma.student.update({
    where: {
      id: student.id,
    },
    data: {
      phone: DEVELOPMENT_STUDENT.phone,
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Student account "${studentAccount.id}" ready`);

  console.log(`✓ Student "${student.name}" connected to student login`);

  console.log('');
  console.log('========================================');
  console.log('Student Login Development Credentials');
  console.log('========================================');
  console.log('URL: http://demo.localhost:3000/student/login?tenant=demo');
  console.log(`Student ID: ${DEVELOPMENT_STUDENT.admissionNumber}`);
  console.log(`Mobile: ${DEVELOPMENT_STUDENT.phone}`);
  console.log(`Passkey: ${DEVELOPMENT_STUDENT.password}`);
  console.log('========================================');
  console.log('');

  // ------------------------------------------------------------
  // First Tenant student
  // ------------------------------------------------------------

  const firstTenant = await prisma.tenant.findFirst({
    where: {
      slug: 'first-tenant',
    },
  });

  if (!firstTenant) {
    console.log('⚠ First Tenant not found.');
  } else {
    const firstTenantStudent = await prisma.student.findFirst({
      where: {
        tenantId: firstTenant.id,
        admissionNumber: FIRST_TENANT_STUDENT.admissionNumber,
      },
    });

    if (!firstTenantStudent) {
      console.log(`⚠ First Tenant student "${FIRST_TENANT_STUDENT.admissionNumber}" not found.`);
    } else {
      console.log(`✓ First Tenant student "${firstTenantStudent.name}" found`);

      const firstTenantStudentAccount = await prisma.studentAccount.upsert({
        where: {
          studentId_tenantId: {
            studentId: firstTenantStudent.id,
            tenantId: firstTenant.id,
          },
        },
        update: {
          passwordHash: hashPassword(FIRST_TENANT_STUDENT.password),
          isActive: true,
        },
        create: {
          tenantId: firstTenant.id,
          studentId: firstTenantStudent.id,
          passwordHash: hashPassword(FIRST_TENANT_STUDENT.password),
          isActive: true,
        },
      });

      await prisma.student.update({
        where: {
          id: firstTenantStudent.id,
        },
        data: {
          status: 'ACTIVE',
        },
      });

      console.log(
        `✓ First Tenant student "${firstTenantStudent.name}" connected to student account ${firstTenantStudentAccount.id}`,
      );

      console.log('');
      console.log('========================================');
      console.log('First Tenant Student Login');
      console.log('========================================');
      console.log('URL: http://first-tenant.localhost:3000/student/login?tenant=first-tenant');
      console.log(`Student ID: ${FIRST_TENANT_STUDENT.admissionNumber}`);
      console.log(`Passkey: ${FIRST_TENANT_STUDENT.password}`);
      console.log('========================================');
      console.log('');
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
