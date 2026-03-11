const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== Checking users with email: admin@riselocal.in ===');
    const users = await prisma.tenantUser.findMany({
      where: { email: 'admin@riselocal.in' },
      include: { tenant: { select: { id: true, slug: true, name: true } } }
    });
    
    console.log(`Found ${users.length} user(s):`);
    users.forEach((u, i) => {
      console.log(`\n[${i+1}] User: ${u.email}`);
      console.log(`    ID: ${u.id}`);
      console.log(`    Name: ${u.name}`);
      console.log(`    Role: ${u.role}`);
      console.log(`    Active: ${u.isActive}`);
      console.log(`    Tenant: ${u.tenant?.name} (${u.tenant?.slug})`);
      console.log(`    Password Hash: ${u.passwordHash.substring(0, 20)}...`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
