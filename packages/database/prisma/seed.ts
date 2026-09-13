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

function hashPassword(plainText: string): string {
  const normalized = plainText.trim();
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalized, salt, SCRYPT_KEYLEN).toString('hex');

  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding development database...');

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

  const existingUser = await prisma.tenantUser.findFirst({
    where: {
      tenantId: tenant.id,
      email: DEVELOPMENT_ADMIN.email,
    },
  });

  if (existingUser) {
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