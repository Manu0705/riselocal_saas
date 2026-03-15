'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { fetchLeadsForTenant, resolveTenant, type TenantRecord } from '@/lib/tenant-client';
import { DUMMY_LEADS } from '@/lib/mock-data';
import {
  getDashboardRefreshEventName,
  getDashboardRefreshStorageKey,
  hasTenantLiveData,
  markTenantAsLive,
  parseDashboardRefreshPayload,
} from '@/lib/dashboard-events';

// Centralized metrics calculation to ensure consistency across all dashboard pages
export type DashboardMetrics = {
  // Lead counts
  totalLeads: number;
  openLeads: number;
  followUpLeads: number;
  convertedLeads: number;

  // Conversion metrics
  conversionRate: number;

  // Follow-up time metrics
  followUpsToday: number;
  followUpsOverdue: number;
  followUpsUnscheduled: number;

  // Recent activity
  recentLeadName: string;
  recentLeadDate: string;
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

export function DashboardDataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { tenantSlug } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const clearBeforeRefresh = useCallback(() => {
    setLeads([]);
    setLoading(true);
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
      clearBeforeRefresh();
      triggerRefresh();
    };

    const handleStorageRefresh = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const payload = parseDashboardRefreshPayload(event.newValue);
      if (!payload) return;
      if (!shouldHandleRefreshForTenant(payload.tenantKey)) return;
      clearBeforeRefresh();
      triggerRefresh();
    };

    globalThis.window.addEventListener(eventName, handleCustomRefresh as EventListener);
    globalThis.window.addEventListener('storage', handleStorageRefresh);

    return () => {
      globalThis.window.removeEventListener(eventName, handleCustomRefresh as EventListener);
      globalThis.window.removeEventListener('storage', handleStorageRefresh);
    };
  }, [shouldHandleRefreshForTenant, clearBeforeRefresh, triggerRefresh]);

  useEffect(() => {
    if (!tenantSlug) {
      setError('Tenant not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch both tenant info and leads in parallel
    Promise.allSettled([resolveTenant(tenantSlug), fetchLeadsForTenant(tenantSlug)])
      .then(([tenantResult, leadsResult]) => {
        const resolvedTenant = tenantResult.status === 'fulfilled' ? tenantResult.value : null;

        if (tenantResult.status === 'fulfilled') {
          setTenant(tenantResult.value);
        } else {
          setTenant(null);
        }

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
          // On error, use dummy data for demonstration
          setLeads(DUMMY_LEADS);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        // Use dummy data even on error so dashboard is functional
        setLeads(DUMMY_LEADS);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug, refreshKey]);

  // Centralized metrics calculation - single source of truth
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalLeads = leads.length;

    // Status-based counts
    const convertedLeads = leads.filter((lead) => lead?.status === 'Converted').length;
    const followUpLeads = leads.filter((lead) => lead?.status === 'Follow-Up').length;
    const openLeads = Math.max(0, totalLeads - convertedLeads - followUpLeads);

    // Conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Follow-up time analysis
    const todayStart = getStartOfDay(new Date());
    const followUpItems = leads.filter((item) => item?.status === 'Follow-Up');

    let followUpsToday = 0;
    let followUpsOverdue = 0;
    let followUpsUnscheduled = 0;

    followUpItems.forEach((item) => {
      const timestamp = parseFollowUpDate(item);

      if (!timestamp) {
        followUpsUnscheduled++;
      } else if (timestamp < todayStart) {
        followUpsOverdue++;
      } else if (timestamp === todayStart) {
        followUpsToday++;
      }
    });

    // Recent activity
    const sortedLeads = [...leads].sort((a, b) => {
      const dateA = new Date(a?.createdAt ?? 0).getTime();
      const dateB = new Date(b?.createdAt ?? 0).getTime();
      return dateB - dateA;
    });

    const recentLead = sortedLeads[0];
    const recentLeadName = recentLead?.name ?? 'N/A';
    const recentLeadDate = recentLead?.createdAt
      ? new Date(recentLead.createdAt).toLocaleDateString()
      : 'N/A';

    return {
      totalLeads,
      openLeads,
      followUpLeads,
      convertedLeads,
      conversionRate,
      followUpsToday,
      followUpsOverdue,
      followUpsUnscheduled,
      recentLeadName,
      recentLeadDate,
    };
  }, [leads]);

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
