'use client';

import MobilePageTitle from '../components/mobile-page-title';

export default function HelpPage() {
  return (
    <div style={{ padding: 16, color: 'var(--text)', display: 'grid', gap: 14 }}>
      <MobilePageTitle title="Help" />

      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>Tenant Guide</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          Use this page to understand existing functionality, request enhancements, and report
          issues for your tenant setup.
        </p>
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15 }}>Customize and Branding</h3>
        <ul style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14, paddingLeft: 18 }}>
          <li>Update logo, banner, colors, and contact details from Customize.</li>
          <li>Use Save Changes in Branding to apply non-image updates.</li>
          <li>Gallery categories and images are managed from Customize - Gallery.</li>
        </ul>
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15 }}>Leads and Followups</h3>
        <ul style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14, paddingLeft: 18 }}>
          <li>Manual leads and public leads follow the same lead lifecycle logic.</li>
          <li>Followup reminders decrement daily and switch to Today within 24 hours.</li>
          <li>Use Followups page sections: Today, Overdue, Upcoming, Unscheduled.</li>
        </ul>
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15 }}>Need Enhancement or Support?</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          Share the tenant slug, page name, and issue details with expected behavior. Include a
          screenshot if possible so fixes can be applied faster.
        </p>
      </div>
    </div>
  );
}
