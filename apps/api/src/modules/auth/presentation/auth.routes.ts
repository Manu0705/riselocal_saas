import { Router } from 'express';
import { JwtService } from '../infrastructure/jwt.service';
import { PrismaTenantRepository } from '../../tenant/infrastructure/tenant.prisma.repository';
import { prisma } from '@saas/database';
import { verifyPassword } from '../infrastructure/password.service';

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
      return res.status(400).json({ error: 'Email and password are required' });
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
        return res.status(400).json({ error: 'tenantId or tenantSlug is required' });
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const resolvedRole = String(user.role || 'owner').toLowerCase();
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
    return res
      .status(500)
      .json({ error: 'Login service temporarily unavailable. Please try again.' });
  }
});

router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const configuredAdminPassword = process.env.ADMIN_PASSWORD as string;

  if (password !== configuredAdminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const userId = email.trim().toLowerCase();
  const token = jwtService.sign({
    userId,
    tenantId: 'admin',
    role: 'admin',
  });

  return res.json({
    token,
    user: {
      userId,
      tenantId: 'admin',
      role: 'admin',
    },
  });
});

export default router;
