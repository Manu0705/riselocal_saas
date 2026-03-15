import { prisma } from '@saas/database';
import { TenantConfig, TenantConfigProvider } from '../application/create-feedback.usecase';

/**
 * PrismaTenantConfigProvider
 *
 * Infrastructure implementation of TenantConfigProvider.
 * Responsible only for fetching tenant configuration from DB.
 */
export class PrismaTenantConfigProvider implements TenantConfigProvider {
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
      },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      feedbackAllowsRating: true,
      feedbackRequiresApproval: true,
    };
  }
}
