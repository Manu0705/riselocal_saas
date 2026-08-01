import { prisma } from '@saas/database';
import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { adminRoleMiddleware } from '../../auth/presentation/admin-role.middleware';
import { hashPassword } from '../../auth/infrastructure/password.service';
import {
  normalizeTenantUserRole,
  TENANT_USER_ROLES,
} from '@saas/domain-core/auth.contract';

const router = Router();
const ALLOWED_TENANT_ROLES = new Set<string>(TENANT_USER_ROLES);

router.use('/tenant-users', authMiddleware, adminRoleMiddleware);

router.get('/tenant-users', async (req, res) => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId.trim() : '';

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
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

    return res.json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
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
      return res
        .status(400)
        .json({ success: false, message: 'tenantId, name, email and password are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const candidate = String(role || 'owner')
      .trim()
      .toLowerCase();
    if (!ALLOWED_TENANT_ROLES.has(candidate)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant role' });
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

    return res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
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
      return res.status(400).json({ success: false, message: 'id is required' });
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
        return res
          .status(400)
          .json({ success: false, message: 'Password must be at least 8 characters' });
      }
      data.passwordHash = hashPassword(password);
    }

    if (typeof role === 'string') {
      const candidate = role.trim().toLowerCase();
      if (!ALLOWED_TENANT_ROLES.has(candidate)) {
        return res.status(400).json({ success: false, message: 'Invalid tenant role' });
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

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/tenant-users/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    await prisma.tenantUser.delete({ where: { id } });

    return res.json({ success: true, message: 'Tenant user deleted' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
