const { PrismaClient } = require('./packages/database/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== All TenantUsers in database ===\n');
    const users = await prisma.tenantUser.findMany({
      include: { tenant: { select: { id: true, slug: true, name: true } } },
    });

    console.log(`Total users: ${users.length}\n`);
    users.forEach((u, i) => {
      console.log(
        `[${i + 1}] ${u.email} | Tenant: ${u.tenant?.name} (${u.tenant?.slug}) | Role: ${u.role} | Active: ${u.isActive}`,
      );
    });

    console.log('\n=== All Tenants ===\n');
    const tenants = await prisma.tenant.findMany();
    console.log(`Total tenants: ${tenants.length}\n`);
    tenants.forEach((t, i) => {
      console.log(`[${i + 1}] ${t.slug} | ${t.name}`);
    });

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
