import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Seeds default settings, services, and gallery for a new tenant
 * Called when a tenant is created
 */
export async function seedTenantDefaults(tenantId: string) {
  try {
    // Create default settings if not exists
    const existingSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!existingSettings) {
      await prisma.tenantSettings.create({
        data: {
          tenantId,
          logoShape: 'circle',
          primaryColor: '#1F2937', // Dark gray
          secondaryColor: '#3B82F6', // Blue
          sectionOrder: ['hero', 'services', 'gallery'],
          tagline: 'Welcome to our service',
        },
      });
    }

    // Create default services
    const existingServices = await prisma.service.count({
      where: { tenantId },
    });

    if (existingServices === 0) {
      const defaultServices = [
        {
          tenantId,
          name: 'Service 1',
          description: 'Professional service with high quality',
          icon: 'star',
          position: 0,
        },
        {
          tenantId,
          name: 'Service 2',
          description: 'Reliable and affordable service',
          icon: 'shield',
          position: 1,
        },
        {
          tenantId,
          name: 'Service 3',
          description: 'Fast and efficient service delivery',
          icon: 'zap',
          position: 2,
        },
      ];

      for (const service of defaultServices) {
        await prisma.service.create({ data: service });
      }
    }

    // Create default gallery categories with sample entries
    const existingGallery = await prisma.galleryImage.count({
      where: { tenantId },
    });

    if (existingGallery === 0) {
      const defaultGalleryItems = [
        {
          tenantId,
          url: 'https://images.unsplash.com/photo-1552053831-71594a27c62d?w=500',
          category: 'gallery',
          position: 0,
          alt: 'Sample image 1',
        },
        {
          tenantId,
          url: 'https://images.unsplash.com/photo-1540575467063-178f50002cbc?w=500',
          category: 'gallery',
          position: 1,
          alt: 'Sample image 2',
        },
        {
          tenantId,
          url: 'https://images.unsplash.com/photo-1469022785867-1501139083eb?w=500',
          category: 'gallery',
          position: 2,
          alt: 'Sample image 3',
        },
      ];

      for (const item of defaultGalleryItems) {
        try {
          await prisma.galleryImage.create({ data: item });
        } catch {
          // Skip if duplicate URL for tenant
          console.log(`Skipping duplicate gallery item for tenant ${tenantId}`);
        }
      }
    }

    console.log(`✓ Seeded defaults for tenant: ${tenantId}`);
    return true;
  } catch (error) {
    console.error(`Error seeding tenant defaults for ${tenantId}:`, error);
    return false;
  }
}

/**
 * Seed a specific tenant when running this file directly
 * Usage: TENANT_ID=xxx ts-node packages/database/src/seed-tenant.ts
 */
if (require.main === module) {
  const tenantId = process.env.TENANT_ID;
  if (!tenantId) {
    console.error('Please provide TENANT_ID environment variable');
    process.exit(1);
  }

  seedTenantDefaults(tenantId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedTenantDefaults;
