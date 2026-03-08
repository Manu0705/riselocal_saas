import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with 5 tenants...')

  // Create the 5 tenants
  const tenants = [
    {
      name: 'JB Interior Curtains',
      slug: 'jb-interior-curtains',
      domain: null,
    },
    {
      name: 'Aluminium Doors and Windows',
      slug: 'aluminium-doors-windows',
      domain: null,
    },
    {
      name: 'SMart Wholesale Mart',
      slug: 'smart-wholesale-mart',
      domain: null,
    },
    {
      name: 'WhatsApp Business 1',
      slug: 'whatsapp-business-1',
      domain: null,
    },
    {
      name: 'WhatsApp Business 2',
      slug: 'whatsapp-business-2',
      domain: null,
    },
  ]

  for (const tenant of tenants) {
    const existing = await prisma.tenant.findUnique({
      where: { slug: tenant.slug },
    })

    if (existing) {
      console.log(`✓ Tenant "${tenant.name}" already exists`)
    } else {
      await prisma.tenant.create({
        data: tenant,
      })
      console.log(`✓ Created tenant "${tenant.name}"`)
    }
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
