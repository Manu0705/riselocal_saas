'use client';

import { Clock3, Phone, Star } from 'lucide-react';
import NotificationItem from '@/components/notification-item';
import MobilePageTitle from '../components/mobile-page-title';
import { useDashboardData } from '@/context/DashboardDataContext';

export default function NotificationsPage() {
  const { metrics, missedFollowUps, loading, error } = useDashboardData();

  const activities = metrics.recentActivities.slice(0, 8);

  const notifications = activities.map((activity) => {
    const type = String(activity.type || '').toUpperCase();
    let icon = Star;
    if (type.includes('CALL')) {
      icon = Phone;
    } else if (type.includes('FOLLOW')) {
      icon = Clock3;
    }
    const title = `${activity.leadName} - ${type.replaceAll('_', ' ').toLowerCase()}`;
    const time = activity.timestamp
      ? new Date(activity.timestamp).toLocaleString()
      : 'Just now';

    return {
      id: activity.id,
      icon,
      title,
      time,
    };
  });

  const missedFollowUpNotifications = missedFollowUps.map((entry) => {
    const missedLabel = entry.daysMissed === 1 ? 'yesterday' : `${entry.daysMissed} days ago`;

    return {
      id: entry.id,
      icon: Clock3,
      title: `${entry.leadName} - Missed follow-up ${missedLabel}`,
      time: new Date(entry.followUpAt).toLocaleDateString(),
    };
  });

  const mergedNotifications = [...missedFollowUpNotifications, ...notifications].slice(0, 20);

  const notificationsContent =
    mergedNotifications.length > 0 ? (
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {mergedNotifications.map((item) => (
          <NotificationItem
            key={item.id}
            icon={item.icon}
            title={item.title}
            time={item.time}
            onClick={() => {}}
          />
        ))}
      </div>
    ) : (
      <p style={{ color: 'var(--muted)' }}>
        No live notifications yet. New lead activity will appear here.
      </p>
    );

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <MobilePageTitle title="Notifications" />

      {loading ? <p style={{ color: 'var(--muted)' }}>Loading notifications...</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>Error: {error}</p> : null}

      {!loading && !error ? notificationsContent : null}
    </div>
  );
}
