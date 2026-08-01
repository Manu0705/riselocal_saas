import crypto from 'node:crypto';
import { prisma, Prisma } from '@saas/database';
import { normalizeLeadStatus, type LeadStatus } from '@saas/domain-core/lead.contract';

type LeadVisibilityRole = 'admin' | 'super_admin' | 'owner' | 'manager' | 'staff';

type UpsertLeadInput = {
  tenantId: string;
  actorUserId?: string;
  name: string;
  phone: string;
  location?: string;
  email?: string;
  notes?: string;
  bookingDate?: string;
  selectedServices?: unknown[];
  selectedTime?: string;
  source?: string;
  campaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  actionType: 'whatsapp_click' | 'call_click' | 'enquiry_click' | 'booking' | 'manual_create';
  metadata?: Record<string, unknown>;
};

type ListLeadsInput = {
  tenantId: string;
  role: LeadVisibilityRole;
  userId: string;
  page: number;
  limit: number;
  includeTimeline: boolean;
};

type AnalyticsPartition = 'week' | 'month' | 'quarter' | 'year';

type GetAnalyticsInput = {
  tenantId: string;
  role: LeadVisibilityRole;
  userId: string;
  partition: AnalyticsPartition;
};

type LeadRecord = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string;
  source: string;
  campaignId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  assignedTo: string | null;
  teamId: string | null;
  convertedAt: Date | null;
  followUpAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  assignedToName: string | null;
  timeline: unknown;
};

type SessionRecord = {
  id: string;
};

type TenantUserRecord = {
  id: string;
  name: string;
  role: string;
  teamId: string | null;
};

type SourceMetric = {
  source: string;
  total: number;
  converted: number;
  conversion_rate: number;
};

type LeadsPerAgent = {
  assignedTo: string | null;
  agentName: string;
  leadCount: number;
};

type TimelineBucket = {
  bucket: Date;
  leads: number;
  converted: number;
};

type RecentActivity = {
  id: string;
  leadId: string;
  leadName: string;
  type: string;
  timestamp: Date;
  metadata: unknown;
};

const ACTIVE_SESSION_WINDOW_HOURS = 24;
const ARCHIVE_AFTER_DAYS = 180;
const RETRYABLE_ERROR_CODES = new Set(['40001', '40P01', '53300']);

function normalizeStatus(input?: string): LeadStatus {
  return normalizeLeadStatus(input);
}

function isLikelyDummyPhone(digitsOnly: string): boolean {
  if (!digitsOnly) return true;
  if (digitsOnly.length < 10 || digitsOnly.length > 15) return true;
  if (/^(\d)\1+$/.test(digitsOnly)) return true;
  if (digitsOnly === '1234567890') return true;
  if (digitsOnly === '0123456789') return true;
  return false;
}

function normalizePhoneE164(input: string): string {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (isLikelyDummyPhone(digits)) {
    throw new Error('Invalid or dummy phone number');
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  throw new Error('Phone must be a valid E.164 number');
}

function safeTrim(value?: string): string | null {
  const parsed = String(value ?? '').trim();
  return parsed.length ? parsed : null;
}

function asRole(value?: string): LeadVisibilityRole {
  const role = String(value ?? '')
    .trim()
    .toLowerCase();

  if (role === 'admin' || role === 'super_admin' || role === 'owner' || role === 'manager') {
    return role;
  }

  return 'staff';
}

function toSerializableTimeline(timeline: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(timeline)) return [];
  return timeline as Array<Record<string, unknown>>;
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const code = String((error as { code?: string })?.code ?? '');
      const message = String((error as { message?: string })?.message ?? '');
      const canRetry = RETRYABLE_ERROR_CODES.has(code) || message.includes('deadlock');
      attempt += 1;

      if (!canRetry || attempt >= 3) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Operation failed after retries');
}

function getPartitionWindow(partition: AnalyticsPartition): { since: Date; bucket: string } {
  const now = new Date();
  const since = new Date(now);

  if (partition === 'week') {
    since.setDate(now.getDate() - 7);
    return { since, bucket: 'day' };
  }

  if (partition === 'month') {
    since.setMonth(now.getMonth() - 1);
    return { since, bucket: 'day' };
  }

  if (partition === 'quarter') {
    since.setMonth(now.getMonth() - 3);
    return { since, bucket: 'week' };
  }

  since.setFullYear(now.getFullYear() - 1);
  return { since, bucket: 'month' };
}

async function getActorTeam(userId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ teamId: string | null }>>`
    SELECT "teamId"
    FROM "TenantUser"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  return rows[0]?.teamId ?? null;
}

async function resolveAutoAssignment(tenantId: string): Promise<{ assigneeId: string | null; teamId: string | null }> {
  const staff = await prisma.$queryRaw<TenantUserRecord[]>`
    SELECT "id", "name", "role", "teamId"
    FROM "TenantUser"
    WHERE "tenantId" = ${tenantId}
      AND "isActive" = true
      AND LOWER("role") = 'staff'
    ORDER BY "createdAt" ASC
  `;

  if (staff.length === 0) {
    return { assigneeId: null, teamId: null };
  }

  const load = await prisma.$queryRaw<Array<{ assigneeId: string; total: bigint }>>`
    SELECT "assignedTo" AS "assigneeId", COUNT(*)::bigint AS "total"
    FROM "Lead"
    WHERE "tenantId" = ${tenantId}
      AND "deletedAt" IS NULL
      AND "assignedTo" IS NOT NULL
    GROUP BY "assignedTo"
  `;

  const map = new Map<string, number>();
  load.forEach((row) => {
    map.set(row.assigneeId, Number(row.total));
  });

  const sorted = [...staff].sort((a, b) => {
    const loadA = map.get(a.id) ?? 0;
    const loadB = map.get(b.id) ?? 0;
    if (loadA !== loadB) return loadA - loadB;
    return a.id.localeCompare(b.id);
  });

  return {
    assigneeId: sorted[0].id,
    teamId: sorted[0].teamId,
  };
}

async function resolveManualAssignment(
  tenantId: string,
  actorUserId?: string,
): Promise<{ assigneeId: string | null; teamId: string | null } | null> {
  const userId = String(actorUserId ?? '').trim();
  if (!userId) return null;

  const actorRows = await prisma.$queryRaw<Array<{ id: string; teamId: string | null }>>`
    SELECT "id", "teamId"
    FROM "TenantUser"
    WHERE "id" = ${userId}
      AND "tenantId" = ${tenantId}
      AND "isActive" = true
    LIMIT 1
  `;

  const actor = actorRows[0];
  if (!actor) return null;

  return {
    assigneeId: actor.id,
    teamId: actor.teamId,
  };
}

function buildVisibilityCondition(
  role: LeadVisibilityRole,
  userId: string,
  teamId: string | null,
): Prisma.Sql {
  if (role === 'admin' || role === 'super_admin' || role === 'owner') {
    return Prisma.sql`TRUE`;
  }

  if (role === 'manager') {
    if (teamId) {
      return Prisma.sql`(l."teamId" = ${teamId} OR l."assignedTo" = ${userId})`;
    }

    return Prisma.sql`l."assignedTo" = ${userId}`;
  }

  return Prisma.sql`l."assignedTo" = ${userId}`;
}

export class LeadLifecycleService {
  async upsertLead(input: UpsertLeadInput) {
    if (!input.tenantId) {
      throw new Error('tenantId is required');
    }

    const name = safeTrim(input.name);
    if (!name) {
      throw new Error('name is required');
    }

    const normalizedPhone = normalizePhoneE164(input.phone);

    return withRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.$queryRaw<Array<{ id: string; assignedTo: string | null; teamId: string | null }>>`
          SELECT "id", "assignedTo", "teamId"
          FROM "Lead"
          WHERE "tenantId" = ${input.tenantId}
            AND "phone" = ${normalizedPhone}
          LIMIT 1
        `;

        const isNewLead = existing.length === 0;
        let assigned: { assigneeId: string | null; teamId: string | null };

        if (isNewLead) {
          const prefersActorAssignment = input.actionType === 'manual_create';
          const manualAssignment = prefersActorAssignment
            ? await resolveManualAssignment(input.tenantId, input.actorUserId)
            : null;

          assigned = manualAssignment ?? (await resolveAutoAssignment(input.tenantId));
        } else {
          assigned = {
            assigneeId: existing[0].assignedTo,
            teamId: existing[0].teamId,
          };
        }

        const upserted = await tx.$queryRaw<Array<{ id: string }>>`
          INSERT INTO "Lead" (
            "id", "tenantId", "name", "phone", "email", "source", "campaignId",
            "utmSource", "utmMedium", "utmCampaign", "location", "status", "notes",
            "assignedTo", "teamId", "createdAt", "updatedAt", "deletedAt"
          )
          VALUES (
            ${crypto.randomUUID()},
            ${input.tenantId},
            ${name},
            ${normalizedPhone},
            ${safeTrim(input.email)},
            ${safeTrim(input.source) ?? 'ORGANIC'},
            ${safeTrim(input.campaignId)},
            ${safeTrim(input.utmSource)},
            ${safeTrim(input.utmMedium)},
            ${safeTrim(input.utmCampaign)},
            ${safeTrim(input.location)},
            ${'NEW'},
            ${safeTrim(input.notes)},
            ${assigned.assigneeId},
            ${assigned.teamId},
            NOW(),
            NOW(),
            NULL
          )
          ON CONFLICT ("tenantId", "phone")
          DO UPDATE SET
            "name" = EXCLUDED."name",
            "email" = COALESCE(EXCLUDED."email", "Lead"."email"),
            "location" = COALESCE(EXCLUDED."location", "Lead"."location"),
            "notes" = COALESCE(EXCLUDED."notes", "Lead"."notes"),
            "source" = COALESCE("Lead"."source", EXCLUDED."source"),
            "campaignId" = COALESCE("Lead"."campaignId", EXCLUDED."campaignId"),
            "utmSource" = COALESCE("Lead"."utmSource", EXCLUDED."utmSource"),
            "utmMedium" = COALESCE("Lead"."utmMedium", EXCLUDED."utmMedium"),
            "utmCampaign" = COALESCE("Lead"."utmCampaign", EXCLUDED."utmCampaign"),
            "deletedAt" = NULL,
            "updatedAt" = NOW()
          RETURNING "id"
        `;

        const leadId = upserted[0].id;

        const activeSession = await tx.$queryRaw<SessionRecord[]>`
          SELECT "id"
          FROM "LeadSession"
          WHERE "tenantId" = ${input.tenantId}
            AND "leadId" = ${leadId}
            AND "deletedAt" IS NULL
            AND "startedAt" >= NOW() - (${ACTIVE_SESSION_WINDOW_HOURS} * INTERVAL '1 hour')
          ORDER BY "startedAt" DESC
          LIMIT 1
        `;

        let sessionId = activeSession[0]?.id ?? null;

        if (sessionId) {
          await tx.$executeRaw`
            UPDATE "LeadSession"
            SET "lastActivityAt" = NOW()
            WHERE "id" = ${sessionId}
          `;
        } else {
          const insertedSession = await tx.$queryRaw<SessionRecord[]>`
            INSERT INTO "LeadSession" (
              "id", "tenantId", "leadId", "startedAt", "lastActivityAt", "source", "campaignId",
              "utmSource", "utmMedium", "utmCampaign", "deletedAt"
            )
            VALUES (
              ${crypto.randomUUID()}, ${input.tenantId}, ${leadId}, NOW(), NOW(), ${safeTrim(input.source)},
              ${safeTrim(input.campaignId)}, ${safeTrim(input.utmSource)}, ${safeTrim(input.utmMedium)},
              ${safeTrim(input.utmCampaign)}, NULL
            )
            RETURNING "id"
          `;

          sessionId = insertedSession[0].id;
        }

        await tx.$executeRaw`
          INSERT INTO "LeadActivity" (
            "id", "tenantId", "leadId", "sessionId", "type", "timestamp", "metadata"
          )
          VALUES (
            ${crypto.randomUUID()},
            ${input.tenantId},
            ${leadId},
            ${sessionId},
            ${input.actionType},
            NOW(),
            ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb
          )
        `;

        if (input.actionType === 'booking' || safeTrim(input.bookingDate)) {
          await tx.$executeRaw`
            INSERT INTO "Booking" (
              "id", "tenantId", "leadId", "bookingDate", "selectedServices", "selectedTime", "status", "notes", "createdAt", "updatedAt", "deletedAt"
            )
            VALUES (
              ${crypto.randomUUID()},
              ${input.tenantId},
              ${leadId},
              ${safeTrim(input.bookingDate) ? new Date(String(input.bookingDate)) : null},
              ${input.selectedServices ? JSON.stringify(input.selectedServices) : null}::jsonb,
              ${safeTrim(input.selectedTime) ? safeTrim(input.selectedTime) : null},
              ${'PENDING'},
              ${safeTrim(input.notes)},
              NOW(),
              NOW(),
              NULL
            )
            ON CONFLICT ("tenantId", "leadId")
            DO UPDATE SET
              "bookingDate" = COALESCE(EXCLUDED."bookingDate", "Booking"."bookingDate"),
              "selectedServices" = COALESCE(EXCLUDED."selectedServices", "Booking"."selectedServices"),
              "selectedTime" = COALESCE(EXCLUDED."selectedTime", "Booking"."selectedTime"),
              "notes" = COALESCE(EXCLUDED."notes", "Booking"."notes"),
              "updatedAt" = NOW(),
              "deletedAt" = NULL
          `;
        }

        return {
          leadId,
          sessionId,
          isNewLead,
          tenantId: input.tenantId,
          assignedTo: assigned.assigneeId,
        };
      });
    });
  }

  async logActivity(input: {
    tenantId: string;
    leadId: string;
    type: 'whatsapp_click' | 'call_click' | 'enquiry_click' | 'booking';
    metadata?: Record<string, unknown>;
  }) {
    await withRetry(async () => {
      await prisma.$transaction(async (tx) => {
        const lead = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Lead"
          WHERE "id" = ${input.leadId}
            AND "tenantId" = ${input.tenantId}
            AND "deletedAt" IS NULL
          LIMIT 1
        `;

        if (!lead[0]) {
          throw new Error('Lead not found');
        }

        const session = await tx.$queryRaw<SessionRecord[]>`
          SELECT "id"
          FROM "LeadSession"
          WHERE "tenantId" = ${input.tenantId}
            AND "leadId" = ${input.leadId}
            AND "deletedAt" IS NULL
            AND "startedAt" >= NOW() - (${ACTIVE_SESSION_WINDOW_HOURS} * INTERVAL '1 hour')
          ORDER BY "startedAt" DESC
          LIMIT 1
        `;

        let sessionId = session[0]?.id ?? null;

        if (!sessionId) {
          const created = await tx.$queryRaw<SessionRecord[]>`
            INSERT INTO "LeadSession" (
              "id", "tenantId", "leadId", "startedAt", "lastActivityAt"
            ) VALUES (${crypto.randomUUID()}, ${input.tenantId}, ${input.leadId}, NOW(), NOW())
            RETURNING "id"
          `;
          sessionId = created[0].id;
        }

        await tx.$executeRaw`
          UPDATE "LeadSession"
          SET "lastActivityAt" = NOW()
          WHERE "id" = ${sessionId}
        `;

        await tx.$executeRaw`
          INSERT INTO "LeadActivity" (
            "id", "tenantId", "leadId", "sessionId", "type", "timestamp", "metadata"
          ) VALUES (
            ${crypto.randomUUID()},
            ${input.tenantId},
            ${input.leadId},
            ${sessionId},
            ${input.type},
            NOW(),
            ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb
          )
        `;
      });
    });
  }

  async updateLeadStatus(input: { tenantId: string; leadId: string; status: string; actorUserId?: string }) {
    const status = normalizeStatus(input.status);

    const result = await withRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.$queryRaw<Array<{ id: string; status: string }>>`
          UPDATE "Lead"
          SET
            "status" = ${status},
            "convertedAt" = CASE WHEN ${status} = 'CONVERTED' THEN NOW() ELSE "convertedAt" END,
            "updatedAt" = NOW()
          WHERE "id" = ${input.leadId}
            AND "tenantId" = ${input.tenantId}
            AND "deletedAt" IS NULL
          RETURNING "id", "status"
        `;

        if (!updated[0]) {
          throw new Error('Lead not found');
        }

        const session = await tx.$queryRaw<SessionRecord[]>`
          SELECT "id"
          FROM "LeadSession"
          WHERE "tenantId" = ${input.tenantId}
            AND "leadId" = ${input.leadId}
            AND "deletedAt" IS NULL
          ORDER BY "startedAt" DESC
          LIMIT 1
        `;

        const sessionId = session[0]?.id ?? null;

        if (sessionId) {
          await tx.$executeRaw`
            INSERT INTO "LeadActivity" (
              "id", "tenantId", "leadId", "sessionId", "type", "timestamp", "metadata"
            ) VALUES (
              ${crypto.randomUUID()},
              ${input.tenantId},
              ${input.leadId},
              ${sessionId},
              ${'status_change'},
              NOW(),
              ${JSON.stringify({ status, actorUserId: input.actorUserId ?? null })}::jsonb
            )
          `;
        }

        return updated[0];
      });
    });

    return result;
  }

  async setFollowUp(input: {
    tenantId: string;
    leadId: string;
    followUpAt: string;
    note?: string;
    actorUserId?: string;
  }) {
    const date = new Date(input.followUpAt);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError('followUpAt must be a valid date');
    }

    await prisma.$transaction(async (tx) => {
      const lead = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Lead"
        WHERE "id" = ${input.leadId}
          AND "tenantId" = ${input.tenantId}
          AND "deletedAt" IS NULL
        LIMIT 1
      `;

      if (!lead[0]) {
        throw new Error('Lead not found');
      }

      await tx.$executeRaw`
        INSERT INTO "FollowUp" (
          "id", "note", "followUpAt", "tenantId", "leadId", "createdAt", "updatedAt"
        ) VALUES (
          ${crypto.randomUUID()},
          ${safeTrim(input.note) ?? 'Follow-up reminder'},
          ${date},
          ${input.tenantId},
          ${input.leadId},
          NOW(),
          NOW()
        )
      `;

      await tx.$executeRaw`
        UPDATE "Lead"
        SET "status" = 'QUALIFIED', "updatedAt" = NOW()
        WHERE "id" = ${input.leadId}
          AND "tenantId" = ${input.tenantId}
      `;
    });
  }

  async assignLead(input: { tenantId: string; leadId: string; assignedTo: string | null; actorUserId?: string }) {
    if (input.assignedTo) {
      const user = await prisma.$queryRaw<Array<{ id: string; teamId: string | null }>>`
        SELECT "id", "teamId"
        FROM "TenantUser"
        WHERE "id" = ${input.assignedTo}
          AND "tenantId" = ${input.tenantId}
          AND "isActive" = true
        LIMIT 1
      `;

      if (!user[0]) {
        throw new Error('Assignee is not part of the tenant');
      }

      await prisma.$executeRaw`
        UPDATE "Lead"
        SET "assignedTo" = ${input.assignedTo}, "teamId" = ${user[0].teamId}, "updatedAt" = NOW()
        WHERE "id" = ${input.leadId}
          AND "tenantId" = ${input.tenantId}
          AND "deletedAt" IS NULL
      `;
      return;
    }

    await prisma.$executeRaw`
      UPDATE "Lead"
      SET "assignedTo" = NULL, "teamId" = NULL, "updatedAt" = NOW()
      WHERE "id" = ${input.leadId}
        AND "tenantId" = ${input.tenantId}
        AND "deletedAt" IS NULL
    `;
  }

  async softDeleteLead(input: { tenantId: string; leadId: string }) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "Lead"
        SET "deletedAt" = NOW(), "updatedAt" = NOW()
        WHERE "id" = ${input.leadId}
          AND "tenantId" = ${input.tenantId}
          AND "deletedAt" IS NULL
      `;

      await tx.$executeRaw`
        UPDATE "LeadSession"
        SET "deletedAt" = NOW()
        WHERE "leadId" = ${input.leadId}
          AND "tenantId" = ${input.tenantId}
          AND "deletedAt" IS NULL
      `;
    });
  }

  async listLeads(input: ListLeadsInput) {
    const role = asRole(input.role);
    const teamId = role === 'manager' ? await getActorTeam(input.userId) : null;
    const visibility = buildVisibilityCondition(role, input.userId, teamId);
    const offset = Math.max(0, (input.page - 1) * input.limit);

    const timelineSelect = input.includeTimeline
      ? Prisma.sql`COALESCE((
          SELECT json_agg(activity_rows ORDER BY activity_rows."timestamp" DESC)
          FROM (
            SELECT a."id", a."type", a."timestamp", a."metadata"
            FROM "LeadActivity" a
            WHERE a."leadId" = l."id"
              AND a."archivedAt" IS NULL
            ORDER BY a."timestamp" DESC
            LIMIT 50
          ) AS activity_rows
        ), '[]'::json) AS "timeline"`
      : Prisma.sql`'[]'::json AS "timeline"`;

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM "Lead" l
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND ${visibility}
    `);

    const total = Number(totals[0]?.total ?? 0n);

    const leads = await prisma.$queryRaw<LeadRecord[]>(Prisma.sql`
      SELECT
        l."id",
        l."tenantId",
        l."name",
        l."email",
        l."phone",
        l."source",
        l."campaignId",
        l."utmSource",
        l."utmMedium",
        l."utmCampaign",
        l."location",
        l."status",
        l."notes",
        l."assignedTo",
        l."teamId",
        l."convertedAt",
        (
          SELECT f."followUpAt"
          FROM "FollowUp" f
          WHERE f."leadId" = l."id"
            AND f."tenantId" = l."tenantId"
          ORDER BY f."createdAt" DESC
          LIMIT 1
        ) AS "followUpAt",
        l."createdAt",
        l."updatedAt",
        l."deletedAt",
        u."name" AS "assignedToName",
        ${timelineSelect}
      FROM "Lead" l
      LEFT JOIN "TenantUser" u ON u."id" = l."assignedTo"
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND ${visibility}
      ORDER BY l."createdAt" DESC
      LIMIT ${input.limit}
      OFFSET ${offset}
    `);

    const items = leads.map((lead) => ({
      ...lead,
      status: normalizeStatus(lead.status),
      timeline: input.includeTimeline ? toSerializableTimeline(lead.timeline) : [],
    }));

    return {
      items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
    };
  }

  async getAnalytics(input: GetAnalyticsInput) {
    const role = asRole(input.role);
    const teamId = role === 'manager' ? await getActorTeam(input.userId) : null;
    const visibility = buildVisibilityCondition(role, input.userId, teamId);
    const partition = getPartitionWindow(input.partition);

    await this.archiveOldActivities(input.tenantId);

    const summaryRows = await prisma.$queryRaw<Array<{
      total_leads: bigint;
      new_leads: bigint;
      contacted_leads: bigint;
      followup_leads: bigint;
      converted_leads: bigint;
      lost_leads: bigint;
      leads_today: bigint;
      total_sessions: bigint;
    }>>(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS total_leads,
        COUNT(*) FILTER (WHERE l."status" = 'NEW')::bigint AS new_leads,
        COUNT(*) FILTER (WHERE l."status" = 'CONTACTED')::bigint AS contacted_leads,
        COUNT(*) FILTER (WHERE l."status" = 'QUALIFIED')::bigint AS followup_leads,
        COUNT(*) FILTER (WHERE l."status" = 'CONVERTED')::bigint AS converted_leads,
        COUNT(*) FILTER (WHERE l."status" = 'CLOSED')::bigint AS lost_leads,
        COUNT(*) FILTER (WHERE l."createdAt" >= DATE_TRUNC('day', NOW()))::bigint AS leads_today,
        (
          SELECT COUNT(*)::bigint
          FROM "LeadSession" ls
          WHERE ls."tenantId" = ${input.tenantId}
            AND ls."deletedAt" IS NULL
        ) AS total_sessions
      FROM "Lead" l
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND ${visibility}
    `);

    const summary = summaryRows[0] ?? {
      total_leads: 0n,
      new_leads: 0n,
      contacted_leads: 0n,
      followup_leads: 0n,
      converted_leads: 0n,
      lost_leads: 0n,
      leads_today: 0n,
      total_sessions: 0n,
    };

    const sourceBreakdown = await prisma.$queryRaw<SourceMetric[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(TRIM(l."source"), ''), 'ORGANIC') AS source,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE l."status" = 'CONVERTED')::int AS converted,
        ROUND(
          CASE WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE l."status" = 'CONVERTED')::numeric / COUNT(*)::numeric) * 100
          END,
          2
        )::float AS conversion_rate
      FROM "Lead" l
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND ${visibility}
      GROUP BY source
      ORDER BY total DESC
    `);

    const avgTimeRows = await prisma.$queryRaw<Array<{ avg_hours: number | null }>>(Prisma.sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM (l."convertedAt" - l."createdAt")) / 3600)::float AS avg_hours
      FROM "Lead" l
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND l."status" = 'CONVERTED'
        AND l."convertedAt" IS NOT NULL
        AND ${visibility}
    `);

    const leadsPerAgent = await prisma.$queryRaw<LeadsPerAgent[]>(Prisma.sql`
      SELECT
        l."assignedTo",
        COALESCE(u."name", 'Unassigned') AS "agentName",
        COUNT(*)::int AS "leadCount"
      FROM "Lead" l
      LEFT JOIN "TenantUser" u ON u."id" = l."assignedTo"
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND ${visibility}
      GROUP BY l."assignedTo", u."name"
      ORDER BY "leadCount" DESC
    `);

    let bucketExpr = Prisma.sql`DATE_TRUNC('month', l."createdAt")`;
    if (partition.bucket === 'day') {
      bucketExpr = Prisma.sql`DATE_TRUNC('day', l."createdAt")`;
    } else if (partition.bucket === 'week') {
      bucketExpr = Prisma.sql`DATE_TRUNC('week', l."createdAt")`;
    }

    const timeline = await prisma.$queryRaw<TimelineBucket[]>(Prisma.sql`
      SELECT
        ${bucketExpr} AS bucket,
        COUNT(*)::int AS leads,
        COUNT(*) FILTER (WHERE l."status" = 'CONVERTED')::int AS converted
      FROM "Lead" l
      WHERE l."tenantId" = ${input.tenantId}
        AND l."deletedAt" IS NULL
        AND l."createdAt" >= ${partition.since}
        AND ${visibility}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    const recentActivities = await prisma.$queryRaw<RecentActivity[]>(Prisma.sql`
      SELECT
        a."id",
        a."leadId",
        l."name" AS "leadName",
        a."type",
        a."timestamp",
        a."metadata"
      FROM "LeadActivity" a
      INNER JOIN "Lead" l ON l."id" = a."leadId"
      WHERE a."tenantId" = ${input.tenantId}
        AND a."archivedAt" IS NULL
        AND l."deletedAt" IS NULL
        AND ${visibility}
      ORDER BY a."timestamp" DESC
      LIMIT 50
    `);

    const totalLeads = Number(summary.total_leads);
    const convertedLeads = Number(summary.converted_leads);
    const totalSessions = Number(summary.total_sessions);

    return {
      summary: {
        totalLeads,
        newLeads: Number(summary.new_leads),
        contactedLeads: Number(summary.contacted_leads),
        followupLeads: Number(summary.followup_leads),
        convertedLeads,
        lostLeads: Number(summary.lost_leads),
        leadsToday: Number(summary.leads_today),
        conversionRate: totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0,
        sessionToConversionRatio:
          convertedLeads > 0 ? Number((totalSessions / convertedLeads).toFixed(2)) : 0,
      },
      derived: {
        conversion_rate_by_source: sourceBreakdown,
        avg_time_to_convert: Number((avgTimeRows[0]?.avg_hours ?? 0).toFixed(2)),
        leads_per_agent: leadsPerAgent,
        session_to_conversion_ratio: convertedLeads > 0 ? Number((totalSessions / convertedLeads).toFixed(2)) : 0,
      },
      partition: {
        key: input.partition,
        since: partition.since,
        timeline,
      },
      recentActivities,
    };
  }

  async archiveOldActivities(tenantId: string) {
    await prisma.$executeRaw`
      UPDATE "LeadActivity"
      SET "archivedAt" = NOW()
      WHERE "tenantId" = ${tenantId}
        AND "archivedAt" IS NULL
        AND "timestamp" < NOW() - (${ARCHIVE_AFTER_DAYS} * INTERVAL '1 day')
    `;
  }
}
