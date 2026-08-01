'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  fetchFeedbackForTenant,
  fetchLeadAnalyticsForTenant,
  fetchLeadsForTenant,
  fetchTenantSettingsForTenant,
  resolveTenant,
  type TenantRecord,
} from '@/lib/tenant-client';
import {
  getDashboardRefreshEventName,
  getDashboardRefreshStorageKey,
  parseDashboardRefreshPayload,
} from '@/lib/dashboard-events';
import { normalizeLeadStatus } from '@saas/domain-core/lead.contract';

// Centralized metrics calculation to ensure consistency across all dashboard pages.
export type DashboardMetrics = {
  totalLeads: number;
  openLeads: number;
  followUpLeads: number;
  convertedLeads: number;
  conversionRate: number;
  followUpsToday: number;
  followUpsOverdue: number;
  followUpsUnscheduled: number;
  recentLeadName: string;
  recentLeadDate: string;

  // Derived analytics metrics
  conversionRateBySource: Array<{ source: string; total: number; converted: number; conversion_rate: number }>;
  avgTimeToConvert: number;
  leadsPerAgent: Array<{ assignedTo: string | null; agentName: string; leadCount: number }>;
  sessionToConversionRatio: number;

  // Analytics partitions + activities
  partitionKey: 'week' | 'month' | 'quarter' | 'year';
  timeline: Array<{ bucket: string; leads: number; converted: number }>;
  recentActivities: Array<{ id: string; leadId: string; leadName: string; type: string; timestamp: string }>;
};

type DashboardDataContextType = {
  tenant: TenantRecord | null;
  tenantSlug: string | null;
  leads: any[];
  missedFollowUps: Array<{
    id: string;
    leadId: string;
    leadName: string;
    followUpAt: string;
    daysMissed: number;
  }>;
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type LeadAnalyticsPayload = {
  summary?: {
    totalLeads?: number;
    newLeads?: number;
    followupLeads?: number;
    convertedLeads?: number;
    conversionRate?: number;
  };
  derived?: {
    conversion_rate_by_source?: Array<{ source: string; total: number; converted: number; conversion_rate: number }>;
    avg_time_to_convert?: number;
    leads_per_agent?: Array<{ assignedTo: string | null; agentName: string; leadCount: number }>;
    session_to_conversion_ratio?: number;
  };
  partition?: {
    key?: 'week' | 'month' | 'quarter' | 'year';
    timeline?: Array<{ bucket: string; leads: number; converted: number }>;
  };
  recentActivities?: Array<{ id: string; leadId: string; leadName: string; type: string; timestamp: string }>;
};

type FeedbackEntry = {
  leadId: string;
  createdAt?: string;
  status?: string;
};

type LeadLifecyclePolicy = {
  convertedKeepDays: number;
  lostKeepDays: number;
  missedFollowupNotifyDays: number;
};

const PUBLIC_ACTIVITY_TYPES = new Set(['whatsapp_click', 'call_click', 'enquiry_click', 'booking']);
const DEFAULT_LEAD_LIFECYCLE_POLICY: LeadLifecyclePolicy = {
  convertedKeepDays: 14,
  lostKeepDays: 21,
  missedFollowupNotifyDays: 7,
};

function getConfiguredLifecyclePolicy(raw: unknown): LeadLifecyclePolicy {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const toBoundedInt = (value: unknown, fallback: number, min: number, max: number): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const rounded = Math.round(parsed);
    if (rounded < min) return min;
    if (rounded > max) return max;
    return rounded;
  };

  return {
    convertedKeepDays: toBoundedInt(
      source.convertedKeepDays,
      DEFAULT_LEAD_LIFECYCLE_POLICY.convertedKeepDays,
      1,
      60,
    ),
    lostKeepDays: toBoundedInt(source.lostKeepDays, DEFAULT_LEAD_LIFECYCLE_POLICY.lostKeepDays, 1, 90),
    missedFollowupNotifyDays: toBoundedInt(
      source.missedFollowupNotifyDays,
      DEFAULT_LEAD_LIFECYCLE_POLICY.missedFollowupNotifyDays,
      1,
      14,
    ),
  };
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return context;
}

function getStartOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseFollowUpDate(item: any): number | null {
  const raw = item?.followUpAt ?? item?.date;
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.getTime();
}

function parseDateTimestamp(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getTime();
}

function mapStatus(raw?: string): string {
  return normalizeLeadStatus(raw);
}

function isLegacyDemoLead(lead: any): boolean {
  const name = String(lead?.name ?? '')
    .trim()
    .toLowerCase();
  const phone = String(lead?.phone ?? '')
    .trim()
    .toLowerCase();

  const knownDemoNames = new Set([
    'sarah johnson',
    'michael chen',
    'emma rodriguez',
    'james wilson',
    'olivia martinez',
    'david kim',
    'sophia patel',
    'lucas anderson',
    'isabella brown',
    'ethan taylor',
  ]);

  return Boolean(
    (lead as { __isMock?: boolean })?.__isMock ||
      knownDemoNames.has(name) ||
      phone.includes('(555)') ||
      phone.includes('+1 (555)'),
  );
}

function normalizeTenantLeads(input: any[]): any[] {
  const leads = Array.isArray(input) ? input : [];
  if (leads.length === 0) return [];

  const liveLeads = leads.filter((lead) => !isLegacyDemoLead(lead));
  // As soon as at least one real lead exists, hide legacy/demo rows for that tenant.
  return liveLeads.length > 0 ? liveLeads : leads.filter((lead) => !((lead as { __isMock?: boolean })?.__isMock));
}

function buildReviewedLeadSet(feedback: FeedbackEntry[]): Set<string> {
  const leadIds = feedback
    .map((entry) => String(entry?.leadId ?? '').trim())
    .filter(Boolean);

  return new Set(leadIds);
}

function shouldDisplayLeadInActiveBoard(
  lead: any,
  reviewedLeadSet: Set<string>,
  nowMs: number,
  policy: LeadLifecyclePolicy,
): boolean {
  const leadId = String(lead?.id ?? '').trim();
  const status = mapStatus(lead?.status);

  if (status === 'CONVERTED') {
    if (leadId && reviewedLeadSet.has(leadId)) {
      return false;
    }

    const convertedAtMs =
      parseDateTimestamp(lead?.convertedAt) ??
      parseDateTimestamp(lead?.updatedAt) ??
      parseDateTimestamp(lead?.createdAt) ??
      nowMs;
    const ageDays = Math.floor((nowMs - convertedAtMs) / (24 * 60 * 60 * 1000));
    return ageDays <= policy.convertedKeepDays;
  }

  if (status === 'CLOSED') {
    const closedAtMs =
      parseDateTimestamp(lead?.updatedAt) ?? parseDateTimestamp(lead?.createdAt) ?? nowMs;
    const ageDays = Math.floor((nowMs - closedAtMs) / (24 * 60 * 60 * 1000));
    return ageDays <= policy.lostKeepDays;
  }

  return true;
}

function orderLeadsForBoard(leads: any[]): any[] {
  return [...leads].sort((a, b) => {
    const statusA = mapStatus(a?.status);
    const statusB = mapStatus(b?.status);
    const isClosedA = statusA === 'CLOSED';
    const isClosedB = statusB === 'CLOSED';

    if (isClosedA !== isClosedB) {
      return isClosedA ? 1 : -1;
    }

    const createdA = parseDateTimestamp(a?.createdAt) ?? 0;
    const createdB = parseDateTimestamp(b?.createdAt) ?? 0;
    return createdB - createdA;
  });
}

function deriveMissedFollowUpNotifications(leads: any[], policy: LeadLifecyclePolicy) {
  const todayStart = getStartOfDay(new Date());
  const dayMs = 24 * 60 * 60 * 1000;

  const notifications = leads
    .map((lead) => {
      const status = mapStatus(lead?.status);
      if (status !== 'QUALIFIED') return null;

      const followUpAt = parseFollowUpDate(lead);
      if (!followUpAt) return null;

      const followUpDay = new Date(followUpAt);
      followUpDay.setHours(0, 0, 0, 0);
      const followUpStartMs = followUpDay.getTime();

      const daysMissed = Math.floor((todayStart - followUpStartMs) / dayMs);
      if (daysMissed < 1 || daysMissed > policy.missedFollowupNotifyDays) {
        return null;
      }

      return {
        id: `missed-followup-${String(lead?.id ?? '')}-${followUpStartMs}`,
        leadId: String(lead?.id ?? ''),
        leadName: String(lead?.name ?? 'Lead'),
        followUpAt: new Date(followUpStartMs).toISOString(),
        daysMissed,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    leadId: string;
    leadName: string;
    followUpAt: string;
    daysMissed: number;
  }>;

  notifications.sort((a, b) => a.daysMissed - b.daysMissed);
  return notifications;
}

function defaultMetricsFromLeads(leads: any[]): DashboardMetrics {
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((lead) => mapStatus(lead?.status) === 'CONVERTED').length;
  const followUpLeads = leads.filter((lead) => mapStatus(lead?.status) === 'QUALIFIED').length;
  const openLeads = leads.filter((lead) => mapStatus(lead?.status) === 'NEW').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const todayStart = getStartOfDay(new Date());
  const dayMs = 24 * 60 * 60 * 1000;
  const followUpItems = leads.filter((item) => mapStatus(item?.status) === 'QUALIFIED');

  let followUpsToday = 0;
  let followUpsOverdue = 0;
  let followUpsUnscheduled = 0;

  followUpItems.forEach((item) => {
    const timestamp = parseFollowUpDate(item);

    if (!timestamp) {
      followUpsUnscheduled += 1;
      return;
    }

    const followUpDayStart = new Date(timestamp);
    followUpDayStart.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((followUpDayStart.getTime() - todayStart) / dayMs);

    if (diffDays < 0) {
      followUpsOverdue += 1;
    } else if (diffDays === 0) {
      followUpsToday += 1;
    }
  });

  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = new Date(a?.createdAt ?? 0).getTime();
    const dateB = new Date(b?.createdAt ?? 0).getTime();
    return dateB - dateA;
  });

  const recentLead = sortedLeads[0];

  return {
    totalLeads,
    openLeads,
    followUpLeads,
    convertedLeads,
    conversionRate,
    followUpsToday,
    followUpsOverdue,
    followUpsUnscheduled,
    recentLeadName: recentLead?.name ?? 'N/A',
    recentLeadDate: recentLead?.createdAt ? new Date(recentLead.createdAt).toLocaleDateString() : 'N/A',
    conversionRateBySource: [],
    avgTimeToConvert: 0,
    leadsPerAgent: [],
    sessionToConversionRatio: 0,
    partitionKey: 'week',
    timeline: [],
    recentActivities: [],
  };
}

function getLatestPublicActivityPerLead(
  recentActivities: Array<{ id: string; leadId: string; leadName: string; type: string; timestamp: string }>,
) {
  if (!Array.isArray(recentActivities) || recentActivities.length === 0) {
    return [] as Array<{ id: string; leadId: string; leadName: string; type: string; timestamp: string }>;
  }

  const normalized = recentActivities
    .map((entry) => ({
      id: String(entry?.id ?? ''),
      leadId: String(entry?.leadId ?? ''),
      leadName: String(entry?.leadName ?? 'Lead'),
      type: String(entry?.type ?? '').toLowerCase(),
      timestamp: String(entry?.timestamp ?? ''),
    }))
    .filter((entry) => entry.leadId && PUBLIC_ACTIVITY_TYPES.has(entry.type));

  normalized.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  const seenLeadIds = new Set<string>();
  const latestByLead: Array<{ id: string; leadId: string; leadName: string; type: string; timestamp: string }> = [];

  for (const activity of normalized) {
    if (seenLeadIds.has(activity.leadId)) continue;
    seenLeadIds.add(activity.leadId);
    latestByLead.push(activity);
  }

  return latestByLead;
}

export function DashboardDataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { tenantSlug } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<LeadAnalyticsPayload | null>(null);
  const [missedFollowUps, setMissedFollowUps] = useState<
    Array<{ id: string; leadId: string; leadName: string; followUpAt: string; daysMissed: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [timeTick, setTimeTick] = useState(() => Date.now());
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setTimeTick(Date.now());
    }, 60 * 1000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const shouldHandleRefreshForTenant = useCallback(
    (incomingTenantKey?: string | null): boolean => {
      const current = String(tenantSlug ?? '')
        .trim()
        .toLowerCase();
      const tenantId = String(tenant?.id ?? '')
        .trim()
        .toLowerCase();
      const tenantResolvedSlug = String(tenant?.slug ?? '')
        .trim()
        .toLowerCase();
      const tenantDomain = String(tenant?.domain ?? '')
        .trim()
        .toLowerCase();
      const incoming = String(incomingTenantKey ?? '')
        .trim()
        .toLowerCase();

      if (!incoming) return true;

      return [current, tenantId, tenantResolvedSlug, tenantDomain]
        .filter(Boolean)
        .includes(incoming);
    },
    [tenantSlug, tenant],
  );

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const eventName = getDashboardRefreshEventName();
    const storageKey = getDashboardRefreshStorageKey();

    const handleCustomRefresh = (event: Event) => {
      const custom = event as CustomEvent<{ tenantKey?: string | null }>;
      const tenantKey = custom.detail?.tenantKey ?? null;
      if (!shouldHandleRefreshForTenant(tenantKey)) return;
      triggerRefresh();
    };

    const handleStorageRefresh = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const payload = parseDashboardRefreshPayload(event.newValue);
      if (!payload) return;
      if (!shouldHandleRefreshForTenant(payload.tenantKey)) return;
      triggerRefresh();
    };

    globalThis.window.addEventListener(eventName, handleCustomRefresh as EventListener);
    globalThis.window.addEventListener('storage', handleStorageRefresh);

    return () => {
      globalThis.window.removeEventListener(eventName, handleCustomRefresh as EventListener);
      globalThis.window.removeEventListener('storage', handleStorageRefresh);
    };
  }, [shouldHandleRefreshForTenant, triggerRefresh]);

  useEffect(() => {
    if (!tenantSlug) {
      setError('Tenant not available');
      setLeads([]);
      setAnalytics(null);
      setLoading(false);
      return;
    }

    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    }
    setError(null);

    Promise.allSettled([
      resolveTenant(tenantSlug),
      fetchLeadsForTenant(tenantSlug),
      fetchLeadAnalyticsForTenant(tenantSlug, 'week'),
      fetchFeedbackForTenant(tenantSlug),
      fetchTenantSettingsForTenant(tenantSlug),
    ])
      .then(([tenantResult, leadsResult, analyticsResult, feedbackResult, settingsResult]) => {
        if (tenantResult.status === 'fulfilled') {
          setTenant(tenantResult.value);
        } else {
          setTenant(null);
        }

        const analyticsPayload =
          analyticsResult.status === 'fulfilled' && analyticsResult.value ? analyticsResult.value : null;
        setAnalytics(analyticsPayload);

        const leadLifecycleConfigRaw =
          settingsResult.status === 'fulfilled' &&
          settingsResult.value &&
          typeof settingsResult.value === 'object'
            ? (settingsResult.value as Record<string, unknown>).leadLifecycle
            : undefined;
        const policy = getConfiguredLifecyclePolicy(leadLifecycleConfigRaw);

        if (leadsResult.status === 'fulfilled') {
          const fetchedLeads = leadsResult.value;
          const normalizedLeads = normalizeTenantLeads(fetchedLeads);
          const feedbackEntries =
            feedbackResult.status === 'fulfilled' && Array.isArray(feedbackResult.value)
              ? (feedbackResult.value as FeedbackEntry[])
              : [];
          const reviewedLeadSet = buildReviewedLeadSet(feedbackEntries);
          const nowMs = Date.now();

          const visibleLeads = normalizedLeads.filter((lead) =>
            shouldDisplayLeadInActiveBoard(lead, reviewedLeadSet, nowMs, policy),
          );

          setLeads(orderLeadsForBoard(visibleLeads));
          setMissedFollowUps(deriveMissedFollowUpNotifications(normalizedLeads, policy));
        } else {
          const message =
            leadsResult.reason instanceof Error
              ? leadsResult.reason.message
              : 'Failed to fetch leads';
          setError(message);
          setLeads([]);
          setMissedFollowUps([]);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLeads([]);
        setMissedFollowUps([]);
        setAnalytics(null);
      })
      .finally(() => {
        setLoading(false);
        hasLoadedOnceRef.current = true;
      });
  }, [tenantSlug, refreshKey]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const fallback = defaultMetricsFromLeads(leads);
    const summary = analytics?.summary;
    const derived = analytics?.derived;

    if (!summary || !derived) {
      return fallback;
    }

    const totalLeads = Number(summary.totalLeads ?? fallback.totalLeads);
    const followUpLeads = Number(summary.followupLeads ?? fallback.followUpLeads);
    const convertedLeads = Number(summary.convertedLeads ?? fallback.convertedLeads);
    const openLeads = Math.max(0, totalLeads - followUpLeads - convertedLeads);

    return {
      ...fallback,
      totalLeads,
      openLeads,
      followUpLeads,
      convertedLeads,
      conversionRate: Number(summary.conversionRate ?? fallback.conversionRate),
      conversionRateBySource: Array.isArray(derived.conversion_rate_by_source)
        ? derived.conversion_rate_by_source
        : [],
      avgTimeToConvert: Number(derived.avg_time_to_convert ?? 0),
      leadsPerAgent: Array.isArray(derived.leads_per_agent) ? derived.leads_per_agent : [],
      sessionToConversionRatio: Number(derived.session_to_conversion_ratio ?? 0),
      partitionKey: analytics?.partition?.key ?? 'week',
      timeline: Array.isArray(analytics?.partition?.timeline)
        ? analytics.partition.timeline.map((entry: any) => ({
            bucket: String(entry.bucket ?? ''),
            leads: Number(entry.leads ?? 0),
            converted: Number(entry.converted ?? 0),
          }))
        : [],
      recentActivities: Array.isArray(analytics?.recentActivities)
        ? getLatestPublicActivityPerLead(
            analytics.recentActivities.map((entry: any) => ({
              id: String(entry.id ?? ''),
              leadId: String(entry.leadId ?? ''),
              leadName: String(entry.leadName ?? 'Lead'),
              type: String(entry.type ?? ''),
              timestamp: String(entry.timestamp ?? ''),
            })),
          )
        : [],
    };
  }, [leads, analytics, timeTick]);

  const refresh = triggerRefresh;

  const contextValue = useMemo(
    () => ({
      tenant,
      tenantSlug,
      leads,
      missedFollowUps,
      metrics,
      loading,
      error,
      refresh,
    }),
    [tenant, tenantSlug, leads, missedFollowUps, metrics, loading, error, refresh],
  );

  return (
    <DashboardDataContext.Provider value={contextValue}>{children}</DashboardDataContext.Provider>
  );
}
