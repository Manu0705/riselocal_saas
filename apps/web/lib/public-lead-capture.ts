import { api } from '@/lib/api-client';
import { announceDashboardDataRefresh } from '@/lib/dashboard-events';

export type LeadActionType = 'whatsapp_click' | 'call_click' | 'enquiry_click' | 'booking';

type CaptureLeadInput = {
  tenantSlug?: string | null;
  source: string;
  actionType: LeadActionType;
  name: string;
  phone: string;
  location?: string;
  email?: string;
  notes?: string;
  bookingDate?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pageUrl?: string;
  buttonId?: string;
};

type CaptureLeadResult = {
  success: boolean;
  leadId?: string;
  sessionId?: string;
  isNewLead?: boolean;
};

const LEAD_CAPTURE_STORAGE_PREFIX = 'publicLeadCapture:';

function safeTrim(value: string | undefined): string {
  return String(value ?? '').trim();
}

function readTenantCapture(key: string): {
  leadId?: string;
  phone?: string;
  name?: string;
  tenantId?: string;
  lastSubmittedAt?: string;
} | null {
  if (globalThis.window === undefined) return null;

  const normalized = safeTrim(key).toLowerCase();
  if (!normalized) return null;

  const raw = localStorage.getItem(`${LEAD_CAPTURE_STORAGE_PREFIX}${normalized}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      leadId: typeof parsed.leadId === 'string' ? parsed.leadId : undefined,
      phone: typeof parsed.phone === 'string' ? parsed.phone : undefined,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      tenantId: typeof parsed.tenantId === 'string' ? parsed.tenantId : undefined,
      lastSubmittedAt: typeof parsed.lastSubmittedAt === 'string' ? parsed.lastSubmittedAt : undefined,
    };
  } catch {
    return null;
  }
}

function persistTenantCapture(
  key: string,
  payload: {
    leadId: string;
    phone: string;
    name: string;
    tenantId?: string;
  },
) {
  if (globalThis.window === undefined) return;

  const normalized = safeTrim(key).toLowerCase();
  if (!normalized) return;

  localStorage.setItem(
    `${LEAD_CAPTURE_STORAGE_PREFIX}${normalized}`,
    JSON.stringify({
      leadId: payload.leadId,
      phone: payload.phone,
      name: payload.name,
      tenantId: payload.tenantId,
      lastSubmittedAt: new Date().toISOString(),
    }),
  );
}

export function getLeadCapturePrefill(tenantSlug?: string | null) {
  const slug = safeTrim(tenantSlug).toLowerCase();
  if (!slug) return null;
  return readTenantCapture(slug);
}

export async function capturePublicCtaLead(input: CaptureLeadInput): Promise<CaptureLeadResult> {
  const tenantSlug = safeTrim(input.tenantSlug).toLowerCase();

  if (!tenantSlug) {
    return { success: false };
  }

  const name = safeTrim(input.name);
  const phone = safeTrim(input.phone);

  if (!name || !phone) {
    return { success: false };
  }

  const pageUrl = safeTrim(input.pageUrl) ||
    (globalThis.window !== undefined ? globalThis.window.location.href : '');

  const payload = {
    name,
    phone,
    source: safeTrim(input.source) || 'ORGANIC',
    actionType: input.actionType,
    location: safeTrim(input.location) || undefined,
    email: safeTrim(input.email) || undefined,
    notes: safeTrim(input.notes) || undefined,
    bookingDate: safeTrim(input.bookingDate) || undefined,
    utmSource: safeTrim(input.utmSource) || undefined,
    utmMedium: safeTrim(input.utmMedium) || undefined,
    utmCampaign: safeTrim(input.utmCampaign) || undefined,
    pageUrl,
    buttonId: safeTrim(input.buttonId) || undefined,
    campaignSource: safeTrim(input.utmSource) || safeTrim(input.source),
  };

  const response = await api.post<{ success?: boolean; data?: any; message?: string }>(
    `/public/tenant/${tenantSlug}/leads/upsert`,
    payload,
  );

  if (response?.success === false || !response?.data?.leadId) {
    return { success: false };
  }

  persistTenantCapture(tenantSlug, {
    leadId: String(response.data.leadId),
    phone,
    name,
    tenantId: typeof response.data.tenantId === 'string' ? response.data.tenantId : undefined,
  });

  announceDashboardDataRefresh(tenantSlug);

  return {
    success: true,
    leadId: String(response.data.leadId),
    sessionId: String(response.data.sessionId ?? ''),
    isNewLead: Boolean(response.data.isNewLead),
  };
}
