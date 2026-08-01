import { Request, Response } from 'express';
import { prisma } from '@saas/database';
import { LeadLifecycleService } from '../infrastructure/lead-lifecycle.service';
import { normalizeLeadStatus } from '@saas/domain-core/lead.contract';
import { isAdminRole, normalizeAuthRole } from '@saas/domain-core/auth.contract';
import { sendError, sendSuccess } from '../../../shared/http/api-response';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
  tenant?: {
    id: string;
    slug: string;
  };
};

const lifecycleService = new LeadLifecycleService();

const PUBLIC_RATE_WINDOW_MS = 60_000;
const PUBLIC_RATE_LIMIT = 20;
const publicRequestBuckets = new Map<string, { count: number; resetAt: number }>();

function getParam(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? String(value[0] ?? '') : String(value);
}

function getStringField(body: Record<string, unknown>, key: string, fallback = ''): string {
  const value = body[key];
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
}

function toTenantRouteKey(req: Request): string {
  const tenantSlug = getParam(req.params.tenantSlug).trim();
  const tenantId = getParam(req.params.tenantId).trim();
  return tenantSlug || tenantId;
}

function isPrivilegedRole(role?: string): boolean {
  return isAdminRole(role);
}

function applyPublicRateLimit(req: Request, tenantId: string): boolean {
  const ip = String(req.ip || req.socket.remoteAddress || 'unknown').trim();
  const key = `${ip}:${tenantId}`;
  const now = Date.now();
  const current = publicRequestBuckets.get(key);

  if (!current || current.resetAt < now) {
    publicRequestBuckets.set(key, { count: 1, resetAt: now + PUBLIC_RATE_WINDOW_MS });
    return true;
  }

  current.count += 1;
  return current.count <= PUBLIC_RATE_LIMIT;
}

async function resolveTenantIdFromRequest(req: AuthenticatedRequest): Promise<string> {
  const fromContext = req.tenant?.id ?? '';
  if (fromContext) {
    return fromContext;
  }

  const routeTenantId = getParam(req.params.tenantId).trim();
  const routeTenantSlug = getParam(req.params.tenantSlug).trim().toLowerCase();
  const userTenantId = String(req.user?.tenantId ?? '').trim();
  const role = String(req.user?.role ?? '').trim();

  if (routeTenantId) {
    if (!isPrivilegedRole(role) && userTenantId && userTenantId !== routeTenantId) {
      throw new Error('Access denied for this tenant');
    }

    return routeTenantId;
  }

  if (routeTenantSlug) {
    const row = await prisma.tenant.findUnique({
      where: { slug: routeTenantSlug },
      select: { id: true },
    });

    if (!row) {
      throw new Error('Tenant not found');
    }

    if (!isPrivilegedRole(role) && userTenantId && userTenantId !== row.id) {
      throw new Error('Access denied for this tenant');
    }

    return row.id;
  }

  if (userTenantId) {
    return userTenantId;
  }

  throw new Error('Unable to resolve tenant');
}

async function resolveTenantIdFromPublicSlug(req: Request): Promise<string> {
  const tenantSlug = getParam(req.params.tenantSlug).trim().toLowerCase();
  if (!tenantSlug) {
    throw new Error('tenantSlug is required');
  }

  const row = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!row) {
    throw new Error('Tenant not found');
  }

  return row.id;
}

async function ensureLeadActionAccess(
  req: AuthenticatedRequest,
  tenantId: string,
  leadId: string,
): Promise<void> {
  const role = normalizeAuthRole(req.user?.role);

  if (isAdminRole(role) || role === 'owner') {
    return;
  }

  const leadRows = await prisma.$queryRaw<Array<{ assignedTo: string | null; teamId: string | null }>>`
    SELECT "assignedTo", "teamId"
    FROM "Lead"
    WHERE "id" = ${leadId}
      AND "tenantId" = ${tenantId}
      AND "deletedAt" IS NULL
    LIMIT 1
  `;

  const lead = leadRows[0];
  if (!lead) {
    throw new Error('Lead not found');
  }

  const userId = String(req.user?.id ?? '').trim();

  if (role === 'staff') {
    if (!lead.assignedTo || lead.assignedTo !== userId) {
      throw new Error('Access denied for this lead');
    }
    return;
  }

  if (role === 'manager') {
    const managerRows = await prisma.$queryRaw<Array<{ teamId: string | null }>>`
      SELECT "teamId"
      FROM "TenantUser"
      WHERE "id" = ${userId}
      LIMIT 1
    `;
    const managerTeamId = managerRows[0]?.teamId ?? null;

    const sameTeam = Boolean(managerTeamId && lead.teamId && managerTeamId === lead.teamId);
    const selfAssigned = Boolean(lead.assignedTo && lead.assignedTo === userId);

    if (!sameTeam && !selfAssigned) {
      throw new Error('Access denied for this lead');
    }
  }
}

function buildActivityMetadata(req: Request, fallbackSource: string) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const metadataInput =
    body.metadata && typeof body.metadata === 'object'
      ? (body.metadata as Record<string, unknown>)
      : {};

  const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl : metadataInput.pageUrl;
  const buttonId = typeof body.buttonId === 'string' ? body.buttonId : metadataInput.buttonId;

  let campaignSource = fallbackSource;
  if (typeof body.campaignSource === 'string') {
    campaignSource = body.campaignSource;
  } else if (typeof body.utmSource === 'string') {
    campaignSource = body.utmSource;
  }

  return {
    pageUrl: typeof pageUrl === 'string' ? pageUrl : null,
    buttonId: typeof buttonId === 'string' ? buttonId : null,
    campaignSource,
    userAgent: req.get('user-agent') ?? null,
  };
}

export class LeadController {
  async publicUpsert(req: Request, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromPublicSlug(req);

      if (!applyPublicRateLimit(req, tenantId)) {
        return sendError(res, 429, 'Too many public lead submissions. Please retry shortly.', {
          code: 'RATE_LIMITED',
          req,
        });
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const source = getStringField(body, 'source', 'ORGANIC');

      const result = await lifecycleService.upsertLead({
        tenantId,
        name: getStringField(body, 'name'),
        phone: getStringField(body, 'phone'),
        location: typeof body.location === 'string' ? body.location : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        bookingDate: typeof body.bookingDate === 'string' ? body.bookingDate : undefined,
        selectedServices: Array.isArray(body.selectedServices)
          ? body.selectedServices.filter((item): item is unknown => item !== null && item !== undefined)
          : undefined,
        selectedTime: typeof body.selectedTime === 'string' ? body.selectedTime : undefined,
        source,
        campaignId: typeof body.campaignId === 'string' ? body.campaignId : undefined,
        utmSource: typeof body.utmSource === 'string' ? body.utmSource : undefined,
        utmMedium: typeof body.utmMedium === 'string' ? body.utmMedium : undefined,
        utmCampaign: typeof body.utmCampaign === 'string' ? body.utmCampaign : undefined,
        actionType:
          body.actionType === 'call_click' ||
          body.actionType === 'whatsapp_click' ||
          body.actionType === 'enquiry_click' ||
          body.actionType === 'booking'
            ? body.actionType
            : 'enquiry_click',
        metadata: buildActivityMetadata(req, source),
      });

      return sendSuccess(res, 201, result, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to capture lead', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async publicGetLead(req: Request, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromPublicSlug(req);
      const leadId = getParam(req.params.id).trim();

      if (!leadId) {
        return sendError(res, 400, 'Lead id is required', { code: 'VALIDATION_ERROR', req });
      }

      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      if (!lead) {
        return sendError(res, 404, 'Lead not found', { code: 'NOT_FOUND', req });
      }

      return sendSuccess(res, 200, lead, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to fetch lead', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async upsert(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const source = getStringField(body, 'source', 'MANUAL');

      const result = await lifecycleService.upsertLead({
        tenantId,
        actorUserId: req.user?.id,
        name: getStringField(body, 'name'),
        phone: getStringField(body, 'phone'),
        location: typeof body.location === 'string' ? body.location : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        bookingDate: typeof body.bookingDate === 'string' ? body.bookingDate : undefined,
        selectedServices: Array.isArray(body.selectedServices)
          ? body.selectedServices.filter((item): item is unknown => item !== null && item !== undefined)
          : undefined,
        selectedTime: typeof body.selectedTime === 'string' ? body.selectedTime : undefined,
        source,
        campaignId: typeof body.campaignId === 'string' ? body.campaignId : undefined,
        utmSource: typeof body.utmSource === 'string' ? body.utmSource : undefined,
        utmMedium: typeof body.utmMedium === 'string' ? body.utmMedium : undefined,
        utmCampaign: typeof body.utmCampaign === 'string' ? body.utmCampaign : undefined,
        actionType:
          body.actionType === 'call_click' ||
          body.actionType === 'whatsapp_click' ||
          body.actionType === 'enquiry_click' ||
          body.actionType === 'booking'
            ? body.actionType
            : 'manual_create',
        metadata: buildActivityMetadata(req, source),
      });

      return sendSuccess(res, 201, result, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to upsert lead', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    // Backward compatibility: existing create endpoints now run strict upsert flow.
    return this.upsert(req, res);
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const role = String(req.user?.role ?? 'staff').toLowerCase();
      const userId = String(req.user?.id ?? '').trim();
      const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '50'), 10) || 50));
      const includeTimeline = String(req.query.includeTimeline ?? 'false').toLowerCase() === 'true';

      const result = await lifecycleService.listLeads({
        tenantId,
        role: role as any,
        userId,
        page,
        limit,
        includeTimeline,
      });

      return sendSuccess(
        res,
        200,
        {
          items: result.items,
          pagination: result.pagination,
        },
        req,
      );
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to fetch leads', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const role = String(req.user?.role ?? 'staff').toLowerCase();
      const userId = String(req.user?.id ?? '').trim();

      const partitionRaw = String(req.query.partition ?? 'week').toLowerCase();
      const partition =
        partitionRaw === 'month' || partitionRaw === 'quarter' || partitionRaw === 'year'
          ? partitionRaw
          : 'week';

      const result = await lifecycleService.getAnalytics({
        tenantId,
        role: role as any,
        userId,
        partition,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to fetch analytics', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const leadId = getParam(req.params.id).trim();
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (!leadId) {
        throw new Error('Lead id is required');
      }

      await ensureLeadActionAccess(req, tenantId, leadId);

      const rawStatus = getStringField(body, 'status');
      if (!rawStatus) {
        throw new Error('status is required');
      }

      // Accept legacy aliases via normalize, but reject completely unknown tokens
      // that normalize would silently coerce only when they are empty — unknown
      // free-text still maps to NEW to preserve prior lifecycle behavior.
      const status = normalizeLeadStatus(rawStatus);

      const result = await lifecycleService.updateLeadStatus({
        tenantId,
        leadId,
        status,
        actorUserId: req.user?.id,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to update lead status', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async setFollowUp(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const leadId = getParam(req.params.id).trim();
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (!leadId) {
        throw new Error('Lead id is required');
      }

      await ensureLeadActionAccess(req, tenantId, leadId);

      await lifecycleService.setFollowUp({
        tenantId,
        leadId,
        followUpAt: getStringField(body, 'followUpAt'),
        note: typeof body.note === 'string' ? body.note : undefined,
        actorUserId: req.user?.id,
      });

      return sendSuccess(res, 200, {}, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to set follow-up', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async assign(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const leadId = getParam(req.params.id).trim();
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (!leadId) {
        throw new Error('Lead id is required');
      }

      await ensureLeadActionAccess(req, tenantId, leadId);

      await lifecycleService.assignLead({
        tenantId,
        leadId,
        assignedTo: typeof body.assignedTo === 'string' && body.assignedTo.trim() ? body.assignedTo.trim() : null,
        actorUserId: req.user?.id,
      });

      return sendSuccess(res, 200, {}, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to assign lead', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async softDelete(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const leadId = getParam(req.params.id).trim();

      if (!leadId) {
        throw new Error('Lead id is required');
      }

      await ensureLeadActionAccess(req, tenantId, leadId);

      await lifecycleService.softDeleteLead({ tenantId, leadId });

      return sendSuccess(res, 200, {}, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to delete lead', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async logActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      const leadId = getParam(req.params.id).trim();
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (!leadId) {
        throw new Error('Lead id is required');
      }

      await ensureLeadActionAccess(req, tenantId, leadId);

      const type = getStringField(body, 'type').toLowerCase();
      if (type !== 'whatsapp_click' && type !== 'call_click' && type !== 'enquiry_click' && type !== 'booking') {
        throw new Error('Invalid activity type');
      }

      await lifecycleService.logActivity({
        tenantId,
        leadId,
        type,
        metadata: buildActivityMetadata(req, type),
      });

      return sendSuccess(res, 200, {}, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to log activity', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async archiveActivities(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = await resolveTenantIdFromRequest(req);
      await lifecycleService.archiveOldActivities(tenantId);
      return sendSuccess(res, 200, {}, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to archive activities', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  getTenantRouteKey(req: Request): string {
    return toTenantRouteKey(req);
  }
}
