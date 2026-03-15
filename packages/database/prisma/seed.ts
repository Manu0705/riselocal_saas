import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with 5 tenants...');

  // Create sample tenants (for development/testing only)
  const tenants = [
    {
      name: 'Demo Business',
      slug: 'demo',
      domain: null,
    },
  ];

  for (const tenant of tenants) {
    const existing = await prisma.tenant.findUnique({
      where: { slug: tenant.slug },
    });

    if (existing) {
      console.log(`✓ Tenant "${tenant.name}" already exists`);
    } else {
      await prisma.tenant.create({
        data: tenant,
      });
      console.log(`✓ Created tenant "${tenant.name}"`);
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
