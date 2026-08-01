/**
 * Canonical lead status contract — single source of truth for API, web, and admin.
 */

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Display labels used by tenant dashboard UI (title case). */
export const LEAD_STATUS_UI_LABELS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Follow-Up',
  CONVERTED: 'Converted',
  CLOSED: 'Lost',
} as const satisfies Record<LeadStatus, string>;

export type LeadStatusUiLabel = (typeof LEAD_STATUS_UI_LABELS)[LeadStatus];

const LEAD_STATUS_SET = new Set<string>(LEAD_STATUSES);

const LEGACY_STATUS_MAP: Record<string, LeadStatus> = {
  NEW: 'NEW',
  OPEN: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  'FOLLOW-UP': 'QUALIFIED',
  FOLLOW_UP: 'QUALIFIED',
  FOLLOWUP: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  CLOSED: 'CLOSED',
  LOST: 'CLOSED',
  WON: 'CONVERTED',
};

/**
 * Normalize any legacy / UI / API status string to a canonical LeadStatus.
 * Unknown values fall back to NEW (same behavior as LeadLifecycleService).
 */
export function normalizeLeadStatus(input: unknown, fallback: LeadStatus = 'NEW'): LeadStatus {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return fallback;
  }

  const normalized = input.trim().toUpperCase().replace(/\s+/g, '-');
  if (LEGACY_STATUS_MAP[normalized]) {
    return LEGACY_STATUS_MAP[normalized];
  }

  return LEAD_STATUS_SET.has(normalized) ? (normalized as LeadStatus) : fallback;
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && LEAD_STATUS_SET.has(value);
}

export function leadStatusToUiLabel(status: unknown): LeadStatusUiLabel {
  const canonical = normalizeLeadStatus(status);
  return LEAD_STATUS_UI_LABELS[canonical];
}

/** Map a UI label (or free text) back to the API status. */
export function uiLabelToLeadStatus(label: unknown): LeadStatus {
  if (typeof label !== 'string') {
    return 'NEW';
  }

  const trimmed = label.trim();
  const byLabel = (Object.entries(LEAD_STATUS_UI_LABELS) as Array<[LeadStatus, string]>).find(
    ([, ui]) => ui.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byLabel) {
    return byLabel[0];
  }

  return normalizeLeadStatus(trimmed);
}

export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ['CONTACTED', 'CLOSED'],
  CONTACTED: ['QUALIFIED', 'CLOSED'],
  QUALIFIED: ['CONVERTED', 'CLOSED'],
  CONVERTED: [],
  CLOSED: [],
};

export function canTransitionLeadStatus(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true;
  return LEAD_STATUS_TRANSITIONS[from].includes(to);
}
