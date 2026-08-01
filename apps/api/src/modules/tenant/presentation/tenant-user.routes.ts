import { prisma } from '@saas/database';
import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { adminRoleMiddleware } from '../../auth/presentation/admin-role.middleware';
import { hashPassword } from '../../auth/infrastructure/password.service';
import {
  normalizeTenantUserRole,
  TENANT_USER_ROLES,
} from '@saas/domain-core/auth.contract';
import { sendError, sendSuccess } from '../../../shared/http/api-response';

const router = Router();
const ALLOWED_TENANT_ROLES = new Set<string>(TENANT_USER_ROLES);

router.use('/tenant-users', authMiddleware, adminRoleMiddleware);

router.get('/tenant-users', async (req, res) => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId.trim() : '';

    if (!tenantId) {
      return sendError(res, 400, 'tenantId is required', { code: 'VALIDATION_ERROR', req });
    }

    const users = await prisma.tenantUser.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, 200, users, req);
  } catch (error: any) {
    return sendError(res, 500, error.message, { code: 'INTERNAL_ERROR', req });
  }
});

router.post('/tenant-users', async (req, res) => {
  try {
    const { tenantId, name, email, password, role } = req.body as {
      tenantId?: string;
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!tenantId || !name || !email || !password) {
      return sendError(res, 400, 'tenantId, name, email and password are required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    if (password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    const candidate = String(role || 'owner')
      .trim()
      .toLowerCase();
    if (!ALLOWED_TENANT_ROLES.has(candidate)) {
      return sendError(res, 400, 'Invalid tenant role', { code: 'VALIDATION_ERROR', req });
    }
    const normalizedRole = normalizeTenantUserRole(candidate);

    const normalizedEmail = email.trim().toLowerCase();

    const created = await prisma.tenantUser.create({
      data: {
        tenantId: tenantId.trim(),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: normalizedRole,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, 201, created, req);
  } catch (error: any) {
    return sendError(res, 400, error.message, { code: 'VALIDATION_ERROR', req });
  }
});

router.put('/tenant-users/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const { name, password, role, isActive } = req.body as {
      name?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    };

    if (!id) {
      return sendError(res, 400, 'id is required', { code: 'VALIDATION_ERROR', req });
    }

    const data: {
      name?: string;
      passwordHash?: string;
      role?: string;
      isActive?: boolean;
    } = {};

    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }

    if (typeof password === 'string' && password.trim()) {
      if (password.trim().length < 8) {
        return sendError(res, 400, 'Password must be at least 8 characters', {
          code: 'VALIDATION_ERROR',
          req,
        });
      }
      data.passwordHash = hashPassword(password);
    }

    if (typeof role === 'string') {
      const candidate = role.trim().toLowerCase();
      if (!ALLOWED_TENANT_ROLES.has(candidate)) {
        return sendError(res, 400, 'Invalid tenant role', { code: 'VALIDATION_ERROR', req });
      }
      data.role = normalizeTenantUserRole(candidate);
    }

    if (typeof isActive === 'boolean') {
      data.isActive = isActive;
    }

    const updated = await prisma.tenantUser.update({
      where: { id },
      data,
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, 200, updated, req);
  } catch (error: any) {
    return sendError(res, 400, error.message, { code: 'VALIDATION_ERROR', req });
  }
});

router.delete('/tenant-users/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return sendError(res, 400, 'id is required', { code: 'VALIDATION_ERROR', req });
    }

    await prisma.tenantUser.delete({ where: { id } });

    return sendSuccess(res, 200, { message: 'Tenant user deleted' }, req);
  } catch (error: any) {
    return sendError(res, 400, error.message, { code: 'VALIDATION_ERROR', req });
  }
});

export default router;
