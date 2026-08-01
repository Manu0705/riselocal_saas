const { PrismaClient } = require('./packages/database/generated/prisma');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

const SCRYPT_KEYLEN = 64;

function hashPassword(plainText) {
  const normalized = plainText.trim();
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalized, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  try {
    console.log('🚀 Setting up initial admin user...\n');

    // Create default tenant if doesn't exist
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'riselocal' },
    });

    if (!tenant) {
      console.log('📦 Creating default tenant...');
      tenant = await prisma.tenant.create({
        data: {
          slug: 'riselocal',
          name: 'RiseLocal Admin',
          domain: 'riselocal.in',
        },
      });
      console.log(`✓ Tenant created: ${tenant.name} (${tenant.slug})\n`);
    } else {
      console.log(`✓ Tenant exists: ${tenant.name} (${tenant.slug})\n`);
    }

    // Check if admin user exists
    const existingUser = await prisma.tenantUser.findFirst({
      where: {
        email: 'admin@riselocal.in',
        tenantId: tenant.id,
      },
    });

    if (existingUser) {
      console.log('⚠️  Admin user already exists!\n');
      console.log('Existing credentials:');
      console.log(`  Email: admin@riselocal.in`);
      console.log(`  You need the original password to log in.\n`);
      return;
    }

    // Create admin user with password "admin123"
    const plainTextPassword = 'admin123';
    const hashedPassword = hashPassword(plainTextPassword);

    const user = await prisma.tenantUser.create({
      data: {
        email: 'admin@riselocal.in',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'owner',
        isActive: true,
        tenantId: tenant.id,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('🔐 Login Credentials:');
    console.log('  URL: https://www.riselocal.in/login');
    console.log('  Email: admin@riselocal.in');
    console.log(`  Password: ${plainTextPassword}\n`);
    console.log('⚠️  IMPORTANT: Change this password immediately in production!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
