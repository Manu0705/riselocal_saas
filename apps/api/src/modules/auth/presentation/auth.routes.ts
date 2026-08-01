import { Router } from 'express';
import { JwtService } from '../infrastructure/jwt.service';
import { PrismaTenantRepository } from '../../tenant/infrastructure/tenant.prisma.repository';
import { prisma } from '@saas/database';
import { verifyPassword } from '../infrastructure/password.service';
import { normalizeAuthRole } from '@saas/domain-core/auth.contract';
import { sendError } from '../../../shared/http/api-response';

const router = Router();
const jwtService = new JwtService();
const tenantRepository = new PrismaTenantRepository();

router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId } = req.body as {
      email?: string;
      password?: string;
      tenantId?: string;
      tenantSlug?: string;
    };

    const tenantSlug =
      typeof req.body?.tenantSlug === 'string' ? req.body.tenantSlug.trim().toLowerCase() : '';

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let resolvedTenantId = tenantId ? String(tenantId).trim() : '';

    if (tenantSlug) {
      const tenant = await tenantRepository.findBySlug(tenantSlug);
      if (tenant) {
        resolvedTenantId = tenant.toJSON().id;
      }
    }

    let user = null as Awaited<ReturnType<typeof prisma.tenantUser.findFirst>>;

    if (!resolvedTenantId) {
      const matchingUsers = await prisma.tenantUser.findMany({
        where: {
          email: normalizedEmail,
          isActive: true,
        },
        take: 2,
      });

      if (matchingUsers.length !== 1) {
        return sendError(res, 400, 'tenantId or tenantSlug is required', {
          code: 'VALIDATION_ERROR',
          req,
        });
      }

      user = matchingUsers[0];
      resolvedTenantId = user.tenantId;
    } else {
      user = await prisma.tenantUser.findFirst({
        where: {
          tenantId: resolvedTenantId,
          email: normalizedEmail,
          isActive: true,
        },
      });
    }

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendError(res, 401, 'Invalid credentials', { code: 'UNAUTHORIZED', req });
    }

    const resolvedRole = normalizeAuthRole(user.role, 'owner');
    let resolvedTenantSlug = tenantSlug;

    if (!resolvedTenantSlug && resolvedTenantId) {
      const tenant = await tenantRepository.findById(resolvedTenantId);
      resolvedTenantSlug = tenant?.toJSON().slug || '';
    }

    const token = jwtService.sign({
      userId: user.id,
      tenantId: resolvedTenantId,
      role: resolvedRole,
    });

    return res.json({
      success: true,
      token,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        tenantId: resolvedTenantId,
        tenantSlug: resolvedTenantSlug || undefined,
        role: resolvedRole,
      },
    });
  } catch (err: any) {
    console.error('Login route error:', err?.message || err);
    return sendError(res, 500, 'Login service temporarily unavailable. Please try again.', {
      code: 'LOGIN_UNAVAILABLE',
      req,
    });
  }
});

router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required', {
      code: 'VALIDATION_ERROR',
      req,
    });
  }

  const configuredAdminPassword = process.env.ADMIN_PASSWORD as string;

  if (password !== configuredAdminPassword) {
    return sendError(res, 401, 'Invalid admin credentials', { code: 'UNAUTHORIZED', req });
  }

  const adminRole = normalizeAuthRole('admin');
  const userId = email.trim().toLowerCase();
  const token = jwtService.sign({
    userId,
    tenantId: 'admin',
    role: adminRole,
  });

  return res.json({
    success: true,
    token,
    user: {
      userId,
      tenantId: 'admin',
      role: adminRole,
    },
  });
});

export default router;
