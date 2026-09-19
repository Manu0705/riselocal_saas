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

function hashPassword(plainText: string): string {
  const normalized = plainText.trim();
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(
    normalized,
    salt,
    SCRYPT_KEYLEN,
  ).toString('hex');

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
    console.log(
      `✓ User "${DEVELOPMENT_ADMIN.email}" already exists`,
    );
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

    console.log(
      `✓ Created user "${DEVELOPMENT_ADMIN.email}"`,
    );
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
    console.log(
      `⚠ Student "${DEVELOPMENT_STUDENT.admissionNumber}" not found.`,
    );

    console.log(
      'Create the student first, then run the seed again.',
    );

    return;
  }

  console.log(
    `✓ Student "${student.admissionNumber}" found`,
  );

  // ------------------------------------------------------------
  // Student login user
  // ------------------------------------------------------------

  let studentUser = await prisma.tenantUser.findFirst({
    where: {
      tenantId: tenant.id,
      email: DEVELOPMENT_STUDENT.email,
    },
  });

  if (studentUser) {
    console.log(
      `✓ Student user "${DEVELOPMENT_STUDENT.email}" already exists`,
    );
  } else {
    studentUser = await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        name: DEVELOPMENT_STUDENT.name,
        email: DEVELOPMENT_STUDENT.email,
        passwordHash: hashPassword(
          DEVELOPMENT_STUDENT.password,
        ),
        role: DEVELOPMENT_STUDENT.role,
        isActive: true,
      },
    });

    console.log(
      `✓ Created student user "${DEVELOPMENT_STUDENT.email}"`,
    );
  }

  // ------------------------------------------------------------
  // Connect student to student login user
  // ------------------------------------------------------------

  await prisma.student.update({
    where: {
      id: student.id,
    },
    data: {
      phone: DEVELOPMENT_STUDENT.phone,
      userId: studentUser.id,
      status: 'ACTIVE',
    },
  });

  console.log(
    `✓ Student "${student.name}" connected to student login`,
  );

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