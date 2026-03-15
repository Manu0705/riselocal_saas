'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useDashboardData } from '@/context/DashboardDataContext';

const rangeOptions = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Quarterly' },
  { key: 'year', label: 'Yearly' },
] as const;

type RangeKey = (typeof rangeOptions)[number]['key'];

const chartTypeOptions = [
  { key: 'bar', label: 'Bar' },
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
] as const;

type ChartTypeKey = (typeof chartTypeOptions)[number]['key'];

const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function hasReachedMonths(startDate: Date, months: number): boolean {
  const target = new Date(startDate);
  target.setMonth(target.getMonth() + months);
  return new Date() >= target;
}

function getLeadDate(value: unknown): Date | null {
  const raw = (value as { createdAt?: string })?.createdAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - distanceToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function sameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function AnalyticsChart() {
  const { leads, tenant } = useDashboardData();

  const [mode, setMode] = useState<RangeKey>('week');
  const [chartType, setChartType] = useState<ChartTypeKey>('bar');
  const [isMobile, setIsMobile] = useState(false);
  const businessJoinedAt = useMemo(() => {
    if (!tenant?.createdAt) return null;
    const parsed = new Date(tenant.createdAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [tenant?.createdAt]);

  useEffect(() => {
    const media = globalThis.matchMedia('(max-width: 640px)');

    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  const hasQuarterlyAccess = (() => {
    if (!businessJoinedAt) return false;
    return hasReachedMonths(businessJoinedAt, 3);
  })();

  const hasYearlyAccess = (() => {
    if (!businessJoinedAt) return false;
    return hasReachedMonths(businessJoinedAt, 12);
  })();

  const visibleRangeOptions = (() => {
    return rangeOptions.filter((option) => {
      if (option.key === 'quarter') return hasQuarterlyAccess;
      if (option.key === 'year') return hasYearlyAccess;
      return true;
    });
  })();

  useEffect(() => {
    if (mode === 'quarter' && !hasQuarterlyAccess) {
      setMode('month');
      return;
    }

    if (mode === 'year' && !hasYearlyAccess) {
      setMode('month');
    }
  }, [mode, hasQuarterlyAccess, hasYearlyAccess]);

  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);

    const points = weekLabels.map((label, offset) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + offset);
      return { label, date, value: 0 };
    });

    leads.forEach((lead) => {
      const leadDate = getLeadDate(lead);
      if (!leadDate) return;

      const entry = points.find((point) => sameDay(point.date, leadDate));
      if (!entry) return;
      entry.value += 1;
    });

    return points.map((point) => ({ name: point.label, value: point.value }));
  }, [leads]);

  const monthData = useMemo(() => {
    const selectedYear = new Date().getFullYear();
    const totals = new Array(12).fill(0);

    leads.forEach((lead) => {
      const leadDate = getLeadDate(lead);
      if (!leadDate) return;
      if (leadDate.getFullYear() !== selectedYear) return;
      totals[leadDate.getMonth()] += 1;
    });

    return monthLabels.map((label, index) => ({ name: label, value: totals[index] }));
  }, [leads]);

  const quarterData = useMemo(() => {
    const selectedYear = new Date().getFullYear();
    const totals = [0, 0, 0, 0];

    leads.forEach((lead) => {
      const leadDate = getLeadDate(lead);
      if (!leadDate) return;
      if (leadDate.getFullYear() !== selectedYear) return;

      const quarterIndex = Math.floor(leadDate.getMonth() / 3);
      totals[quarterIndex] += 1;
    });

    return totals.map((value, index) => ({ name: `Q${index + 1}`, value }));
  }, [leads]);

  const yearData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, index) => currentYear - 4 + index);
    const totals = new Map<number, number>(years.map((year) => [year, 0]));

    leads.forEach((lead) => {
      const leadDate = getLeadDate(lead);
      if (!leadDate) return;
      const year = leadDate.getFullYear();
      if (!totals.has(year)) return;
      totals.set(year, (totals.get(year) ?? 0) + 1);
    });

    return years.map((year) => ({ name: String(year), value: totals.get(year) ?? 0 }));
  }, [leads]);

  const data = (() => {
    if (mode === 'week') return weekData;
    if (mode === 'month') return monthData;
    if (mode === 'quarter') return quarterData;
    return yearData;
  })();

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: 'inline-flex',
          gap: 4,
          background: 'var(--card)',
          padding: 4,
          borderRadius: 8,
          border: '1px solid var(--card-border)',
        }}
      >
        {visibleRangeOptions.map((option) => {
          const active = mode === option.key;

          return (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              style={{
                border: 'none',
                background: active ? '#10b981' : 'transparent',
                color: active ? '#ffffff' : 'var(--text)',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'default',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          height: 190,
          marginTop: 12,
          position: 'relative',
          border: '1px solid var(--card-border)',
          borderRadius: 10,
          background: 'var(--card)',
          padding: '34px 8px 8px 8px',
        }}
      >
        <div
          role="radiogroup"
          aria-label="Chart type"
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--muted)',
          }}
        >
          {chartTypeOptions.map((option) => (
            <label
              key={option.key}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default' }}
            >
              <input
                type="radio"
                name="analytics-chart-type"
                value={option.key}
                checked={chartType === option.key}
                onChange={() => setChartType(option.key)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={isMobile ? 12 : 30}
              />
            </BarChart>
          ) : null}

          {chartType === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.22}
                strokeWidth={2}
              />
            </AreaChart>
          ) : null}

          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </LineChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
