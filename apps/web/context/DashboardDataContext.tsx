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
  fetchLeadAnalyticsForTenant,
  fetchLeadsForTenant,
  resolveTenant,
  type TenantRecord,
} from '@/lib/tenant-client';
import { DUMMY_LEADS } from '@/lib/mock-data';
import {
  getDashboardRefreshEventName,
  getDashboardRefreshStorageKey,
  hasTenantLiveData,
  markTenantAsLive,
  parseDashboardRefreshPayload,
} from '@/lib/dashboard-events';

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

function mapStatus(raw?: string): string {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase();

  if (value === 'NEW') return 'NEW';
  if (value === 'CONTACTED') return 'CONTACTED';
  if (value === 'QUALIFIED' || value === 'FOLLOW-UP' || value === 'FOLLOWUP') return 'QUALIFIED';
  if (value === 'CONVERTED') return 'CONVERTED';
  if (value === 'CLOSED' || value === 'LOST') return 'CLOSED';
  return 'NEW';
}

function defaultMetricsFromLeads(leads: any[]): DashboardMetrics {
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((lead) => mapStatus(lead?.status) === 'CONVERTED').length;
  const followUpLeads = leads.filter((lead) => mapStatus(lead?.status) === 'QUALIFIED').length;
  const openLeads = leads.filter((lead) => mapStatus(lead?.status) === 'NEW').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const todayStart = getStartOfDay(new Date());
  const followUpItems = leads.filter((item) => mapStatus(item?.status) === 'QUALIFIED');

  let followUpsToday = 0;
  let followUpsOverdue = 0;
  let followUpsUnscheduled = 0;

  followUpItems.forEach((item) => {
    const timestamp = parseFollowUpDate(item);

    if (!timestamp) {
      followUpsUnscheduled += 1;
    } else if (timestamp < todayStart) {
      followUpsOverdue += 1;
    } else if (timestamp === todayStart) {
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

export function DashboardDataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { tenantSlug } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<LeadAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedOnceRef = useRef(false);

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
    ])
      .then(([tenantResult, leadsResult, analyticsResult]) => {
        const resolvedTenant = tenantResult.status === 'fulfilled' ? tenantResult.value : null;

        if (tenantResult.status === 'fulfilled') {
          setTenant(tenantResult.value);
        } else {
          setTenant(null);
        }

        const analyticsPayload =
          analyticsResult.status === 'fulfilled' && analyticsResult.value ? analyticsResult.value : null;
        setAnalytics(analyticsPayload);

        if (leadsResult.status === 'fulfilled') {
          const fetchedLeads = leadsResult.value;

          if (fetchedLeads.length > 0) {
            setLeads(fetchedLeads);
            markTenantAsLive(tenantSlug);
            markTenantAsLive(resolvedTenant?.id);
            markTenantAsLive(resolvedTenant?.slug);
            return;
          }

          const hasLiveData =
            hasTenantLiveData(tenantSlug) ||
            hasTenantLiveData(resolvedTenant?.id) ||
            hasTenantLiveData(resolvedTenant?.slug);

          setLeads(hasLiveData ? [] : DUMMY_LEADS);
        } else {
          setLeads(DUMMY_LEADS);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLeads(DUMMY_LEADS);
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
        ? analytics.recentActivities.map((entry: any) => ({
            id: String(entry.id ?? ''),
            leadId: String(entry.leadId ?? ''),
            leadName: String(entry.leadName ?? 'Lead'),
            type: String(entry.type ?? ''),
            timestamp: String(entry.timestamp ?? ''),
          }))
        : [],
    };
  }, [leads, analytics]);

  const refresh = triggerRefresh;

  const contextValue = useMemo(
    () => ({
      tenant,
      tenantSlug,
      leads,
      metrics,
      loading,
      error,
      refresh,
    }),
    [tenant, tenantSlug, leads, metrics, loading, error, refresh],
  );

  return (
    <DashboardDataContext.Provider value={contextValue}>{children}</DashboardDataContext.Provider>
  );
}
