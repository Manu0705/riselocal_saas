'use client';

import { useState } from 'react';
import LeadCard from '@/components/lead-card';
import StatCard from '@/components/stat-card';
import { useDashboardData } from '@/context/DashboardDataContext';
import MobilePageTitle from '../components/mobile-page-title';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { announceDashboardDataRefresh } from '@/lib/dashboard-events';
import { toast } from 'sonner';

function formatText(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

export default function LeadsPage() {
  const { leads, metrics, loading, error, tenant, tenantSlug, refresh } = useDashboardData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      return;
    }

    const tenantId = tenant?.id || tenantSlug;
    const tenantRouteKey = tenantSlug || tenant?.slug || tenant?.id;

    if (!tenantId || !tenantRouteKey) {
      toast.error('Tenant information not available');
      return;
    }

    setSubmitting(true);
    try {
      const formattedData = {
        name: formatText(formData.name),
        phone: formData.phone,
        source: 'MANUAL',
        actionType: 'manual_create',
        location: formData.location ? formatText(formData.location) : undefined,
      };

      await api.post(`/tenant/${tenantRouteKey}/leads/upsert`, formattedData);

      // Reset form and close
      setFormData({ name: '', phone: '', location: '' });
      setShowAddForm(false);

      // Refresh leads
      refresh();
      announceDashboardDataRefresh(tenantRouteKey);
      toast.success('Lead added successfully');
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const isFormValid = formData.name.trim() && formData.phone.trim();

  const newLeads = leads.filter(
    (lead: any) =>
      String(lead?.status ?? '')
        .toUpperCase()
        .trim() === 'NEW',
  ).length;

  let content: JSX.Element | null = null;

  if (loading) {
    content = <p style={{ color: 'var(--muted)' }}>Loading leads...</p>;
  } else if (error) {
    content = <p style={{ color: '#b91c1c' }}>Error: {error}</p>;
  } else {
    content = (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard label="Total" value={metrics.totalLeads} valueColor="#22c55e" />
          <StatCard label="New" value={newLeads} valueColor="#2563eb" />
          <StatCard label="Followups Today" value={metrics.followUpsToday} valueColor="#f59e0b" />
          <StatCard label="Converted" value={metrics.convertedLeads} valueColor="#10b981" />
        </div>

        {leads.length === 0 ? (
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>No leads found.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {leads.map((lead: any) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 90 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <MobilePageTitle title="Leads" />
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            title="Add lead"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Plus size={28} />
          </button>
        )}
      </div>

      {/* Add Lead Form Card */}
      {showAddForm ? (
        <div
          style={{
            border: '1px solid var(--card-border)',
            borderRadius: 10,
            padding: 16,
            background: 'var(--card)',
            marginBottom: 14,
            boxShadow: '0 4px 12px var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
              Add New Lead
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', phone: '', location: '' });
              }}
              title="Close add lead form"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleAddLead}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Lead Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
              <input
                type="tel"
                placeholder="Contact"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {isFormValid && (
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Adding...' : 'Add Lead'}
              </button>
            )}
          </form>
        </div>
      ) : null}

      {content}
    </div>
  );
}
