'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, Clock, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/context/DashboardDataContext';
import { api } from '@/lib/api-client';
import { announceDashboardDataRefresh } from '@/lib/dashboard-events';
import { toast } from 'sonner';
import {
  LEAD_STATUS_UI_LABELS,
  LEAD_STATUSES,
  leadStatusToUiLabel,
  normalizeLeadStatus,
  uiLabelToLeadStatus,
  type LeadStatus,
  type LeadStatusUiLabel,
} from '@saas/domain-core/lead.contract';

const STATUS_OPTIONS = LEAD_STATUSES.map((status) => LEAD_STATUS_UI_LABELS[status]);
const REMINDER_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

type LeadLike = {
  id?: string;
  name?: string;
  phone?: string;
  status?: string;
  source?: string;
  assignedToName?: string;
  timeline?: Array<{
    id?: string;
    type?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;
  location?: string;
  createdAt?: string;
  followUpAt?: string;
};

function computeDaysFromFollowUp(followUpAt?: string): number {
  if (!followUpAt) return 3;
  const now = Date.now();
  const followUp = new Date(followUpAt).getTime();
  const diffMs = followUp - now;
  if (diffMs <= 0) return 1;
  const diffDays = Math.ceil(diffMs / DAY_MS);
  return Math.max(1, Math.min(7, diffDays));
}

function getStartOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isFollowUpDueToday(followUpAt?: string, nowMs: number = Date.now()): boolean {
  if (!followUpAt) return false;
  const followUpTs = new Date(followUpAt).getTime();
  if (Number.isNaN(followUpTs)) return false;

  const todayStart = getStartOfDay(new Date(nowMs));
  const followUpStart = getStartOfDay(new Date(followUpTs));

  return followUpStart <= todayStart;
}

function isFollowUpOverdue(followUpAt?: string, nowMs: number = Date.now()): boolean {
  if (!followUpAt) return false;
  const followUpTs = new Date(followUpAt).getTime();
  if (Number.isNaN(followUpTs)) return false;

  const todayStart = getStartOfDay(new Date(nowMs));
  const followUpStart = getStartOfDay(new Date(followUpTs));

  return followUpStart < todayStart;
}

export default function LeadCard({ lead }: Readonly<{ lead: LeadLike }>) {
  const { tenantSlug } = useAuth();
  const { tenant } = useDashboardData();
  const [status, setStatus] = useState<LeadStatusUiLabel>(leadStatusToUiLabel(lead?.status));
  const [selectedReminderDay, setSelectedReminderDay] = useState(() =>
    computeDaysFromFollowUp(lead?.followUpAt),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const isMockLead = Boolean((lead as { __isMock?: boolean })?.__isMock);

  useEffect(() => {
    const timerId = globalThis.setInterval(() => {
      setNowMs(Date.now());
    }, 60 * 1000);

    return () => {
      globalThis.clearInterval(timerId);
    };
  }, []);

  // Keep reminder day in sync with the actual followUpAt from server data
  useEffect(() => {
    setSelectedReminderDay(computeDaysFromFollowUp(lead?.followUpAt));
  }, [lead?.followUpAt]);

  useEffect(() => {
    setStatus(leadStatusToUiLabel(lead?.status));
  }, [lead?.status]);

  useEffect(() => {
    if (!lead?.followUpAt) return;
    setSelectedReminderDay(computeDaysFromFollowUp(lead?.followUpAt));
  }, [nowMs, lead?.followUpAt]);

  const createdAtLabel = getRelativeTime(lead?.createdAt);
  const canonicalStatus = uiLabelToLeadStatus(status);
  const convertedStatus = normalizeLeadStatus('CONVERTED');
  const qualifiedStatus = normalizeLeadStatus('QUALIFIED');
  const showReviewButton = canonicalStatus === convertedStatus;
  const showReminderButton = canonicalStatus === qualifiedStatus;

  const followUpDate = lead?.followUpAt ? new Date(lead.followUpAt) : undefined;
  const isFollowUpPastDue = isFollowUpOverdue(lead?.followUpAt, nowMs);
  const isFollowUpToday = isFollowUpDueToday(lead?.followUpAt, nowMs);

  const reminderLabel = isFollowUpPastDue
    ? 'Overdue'
    : isFollowUpToday
      ? 'Today'
      : `${selectedReminderDay}d`;
  const reminderBackground = isFollowUpPastDue
    ? '#f59e0b'
    : isFollowUpToday
      ? '#ef4444'
      : 'var(--background)';
  const reminderColor = isFollowUpPastDue || isFollowUpToday ? 'white' : 'var(--text)';

  const handleCall = () => {
    if (!isMockLead) {
      void logActivity('call_click');
    }
    if (lead?.phone) {
      globalThis.location.href = `tel:${lead.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (!isMockLead) {
      void logActivity('whatsapp_click');
    }
    if (lead?.phone) {
      const cleanPhone = lead.phone.replaceAll(/\D/g, '');
      globalThis.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const handleSendReview = () => {
    if (!lead?.id || !tenantSlug) {
      toast.error('Unable to generate review link');
      return;
    }

    const reviewUrl = `${globalThis.location.origin}/${tenantSlug}/review/${lead.id}`;
    const message = `Hi ${lead.name || 'there'}! Thank you for choosing our service. We'd love to hear your feedback: ${reviewUrl}`;

    if (lead?.phone) {
      if (!isMockLead) {
        void logActivity('enquiry_click');
      }
      const cleanPhone = lead.phone.replaceAll(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      globalThis.open(whatsappUrl, '_blank');
      if (!isMockLead) {
        announceDashboardDataRefresh(tenantSlug || tenant?.slug || tenant?.id);
      }
    } else {
      // Copy link to clipboard if no phone
      navigator.clipboard
        .writeText(reviewUrl)
        .then(() => {
          toast.success('Review link copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy review link');
        });
    }
  };

  const handleStatusChange = async (newStatus: LeadStatusUiLabel) => {
    setStatus(newStatus);

    const leadId = String(lead?.id ?? '').trim();
    const tenantRouteKey = tenantSlug || tenant?.slug || tenant?.id;
    const apiStatus: LeadStatus = uiLabelToLeadStatus(newStatus);

    if (isMockLead || !leadId || !tenantRouteKey) {
      return;
    }

    try {
      await api.patch(`/tenant/${tenantRouteKey}/leads/${leadId}/status`, {
        status: apiStatus,
      });
      announceDashboardDataRefresh(tenantRouteKey);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update the lead status right now.';
      toast.error(message);
    }
  };

  const cycleStatus = (direction: 1 | -1) => {
    const currentIndex = STATUS_OPTIONS.indexOf(status);
    const safeIndex = Math.max(0, currentIndex);
    const nextIndex = (safeIndex + direction + STATUS_OPTIONS.length) % STATUS_OPTIONS.length;
    void handleStatusChange(STATUS_OPTIONS[nextIndex]);
  };

  const cycleReminderDay = (direction: 1 | -1) => {
    if (isFollowUpToday) return; // Don't cycle if due today or overdue
    const currentIndex = REMINDER_DAYS.indexOf(
      selectedReminderDay as (typeof REMINDER_DAYS)[number],
    );
    const safeIndex = Math.max(0, currentIndex);
    const nextIndex = (safeIndex + direction + REMINDER_DAYS.length) % REMINDER_DAYS.length;
    const nextDay = REMINDER_DAYS[nextIndex];
    setSelectedReminderDay(nextDay);
    void setFollowUp(nextDay);
  };

  const logActivity = async (
    type: 'whatsapp_click' | 'call_click' | 'enquiry_click' | 'booking',
  ) => {
    const leadId = String(lead?.id ?? '').trim();
    const tenantRouteKey = tenantSlug || tenant?.slug || tenant?.id;
    if (isMockLead || !leadId || !tenantRouteKey) {
      return;
    }

    try {
      await api.post(`/tenant/${tenantRouteKey}/leads/${leadId}/activity`, {
        type,
        pageUrl: globalThis.location.href,
        buttonId: `lead-card-${type}`,
      });
      announceDashboardDataRefresh(tenantRouteKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log activity right now.';
      toast.error(message);
    }
  };

  const setFollowUp = async (days: number) => {
    const leadId = String(lead?.id ?? '').trim();
    const tenantRouteKey = tenantSlug || tenant?.slug || tenant?.id;
    if (isMockLead || !leadId || !tenantRouteKey) {
      return;
    }

    const followUpAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    try {
      await api.patch(`/tenant/${tenantRouteKey}/leads/${leadId}/followup`, {
        followUpAt,
        note: `Reminder set for ${days} day(s)`,
      });
      announceDashboardDataRefresh(tenantRouteKey);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update the reminder right now.';
      toast.error(message);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        padding: 14,
        background: 'var(--card)',
        boxShadow: '0 8px 20px var(--shadow)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.3px',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lead?.name ?? 'Lead'}
        </p>
        <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {createdAtLabel}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showReminderButton
            ? 'repeat(4, minmax(0, 1fr))'
            : 'repeat(3, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={handleCall}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '10px 8px',
            border: 'none',
            borderRadius: 999,
            background: '#3b82f6',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            minHeight: 40,
            transition: 'transform 120ms ease, opacity 120ms ease',
          }}
        >
          <Phone size={14} />
          Call
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '10px 8px',
            border: 'none',
            borderRadius: 999,
            background: '#25D366',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            minHeight: 40,
            transition: 'transform 120ms ease, opacity 120ms ease',
          }}
        >
          <MessageCircle size={14} />
          WhatsApp
        </button>

        <button
          type="button"
          onClick={() => cycleStatus(1)}
          onWheel={(e) => {
            e.preventDefault();
            cycleStatus(e.deltaY > 0 ? 1 : -1);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '10px 8px',
            border: '1px solid var(--card-border)',
            borderRadius: 999,
            background: 'var(--background)',
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            minHeight: 40,
          }}
          title="Scroll or tap to change status"
        >
          {status}
        </button>

        {showReminderButton ? (
          <button
            type="button"
            onClick={() => cycleReminderDay(1)}
            onWheel={(e) => {
              e.preventDefault();
              cycleReminderDay(e.deltaY > 0 ? 1 : -1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 8px',
              border: isFollowUpPastDue
                ? '1px solid #d97706'
                : isFollowUpToday
                  ? '1px solid #ef4444'
                  : '1px solid var(--card-border)',
              borderRadius: 999,
              background: reminderBackground,
              color: reminderColor,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              minHeight: 40,
            }}
            title="Scroll or tap to change reminder days"
          >
            <Clock size={16} />
            {reminderLabel}
          </button>
        ) : null}
      </div>

      {/* Review Button - Show only for Converted leads */}
      {showReviewButton && (
        <button
          type="button"
          onClick={handleSendReview}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px',
            border: 'none',
            borderRadius: 999,
            background: '#f59e0b',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            marginTop: 8,
            width: '100%',
            cursor: 'pointer',
          }}
          title="Send review request via WhatsApp"
        >
          <Star size={16} />
          Send Review Request
        </button>
      )}
    </div>
  );
}

function getRelativeTime(timestamp?: string): string {
  if (!timestamp) return 'just now';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'just now';

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const mins = Math.max(1, Math.floor(diffMs / minute));
    return `${mins}m ago`;
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours}h ago`;
  }
  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function toReadableActivity(raw?: string): string {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (value === 'whatsapp_click') return 'WhatsApp clicked';
  if (value === 'call_click') return 'Call clicked';
  if (value === 'enquiry_click') return 'Enquiry submitted';
  if (value === 'booking') return 'Booking created';
  if (value === 'status_change') return 'Status updated';
  return value || 'Activity';
}
