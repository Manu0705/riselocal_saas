'use client';

import { useEffect, useState } from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import {
  leadStatusToUiLabel,
  normalizeLeadStatus,
  type LeadStatus,
} from '@saas/domain-core/lead.contract';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: LeadStatus | string;
  source: string;
  location?: string;
  createdAt: string;
  tenantId: string;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tenants.length > 0) {
      fetchLeads();
    }
  }, [selectedTenant, tenants]);

  async function fetchData() {
    try {
      const response = await adminApi.get('/tenants');
      const tenantsData = Array.isArray(response) ? response : response?.data || [];
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeads() {
    try {
      if (selectedTenant === 'all') {
        // Fetch leads from all tenants
        const allLeads: Lead[] = [];
        await Promise.all(
          tenants.map(async (tenant) => {
            try {
              const response = await adminApi.get(`/tenants/${tenant.id}/leads`);
              const tenantLeads = Array.isArray(response) ? response : response?.data || [];
              allLeads.push(...tenantLeads.map((lead: Lead) => ({ ...lead, tenantId: tenant.id })));
            } catch (err) {
              console.error(`Error fetching leads for ${tenant.name}:`, err);
            }
          }),
        );
        setLeads(allLeads);
      } else {
        const response = await adminApi.get(`/tenants/${selectedTenant}/leads`);
        const data = Array.isArray(response) ? response : response?.data || [];
        setLeads(data.map((lead: Lead) => ({ ...lead, tenantId: selectedTenant })));
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  }

  function getStatusColor(status: Lead['status']) {
    switch (normalizeLeadStatus(status)) {
      case 'NEW':
        return '#3b82f6';
      case 'CONTACTED':
        return '#6366f1';
      case 'QUALIFIED':
        return '#f59e0b';
      case 'CONVERTED':
        return '#10b981';
      case 'CLOSED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  function getTenantName(tenantId: string) {
    return tenants.find((t) => t.id === tenantId)?.name || 'Unknown';
  }

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading...</p>
      </div>
    );
  }

  const filteredLeads =
    selectedTenant === 'all' ? leads : leads.filter((lead) => lead.tenantId === selectedTenant);

  return (
    <div className="admin-container">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Leads Management</h1>
        <p style={{ color: 'var(--text-muted)' }}>View and manage leads across all tenants</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Filter by Tenant
          </label>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="input"
            style={{ maxWidth: 300 }}
          >
            <option value="all">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Leads</h2>
        {filteredLeads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No leads found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Status</th>
                <th>Source</th>
                <th>Tenant</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 600 }}>{lead.name}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} color="var(--text-muted)" />
                        <span>{lead.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={14} color="var(--text-muted)" />
                        <span>{lead.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{lead.location || '-'}</td>
                  <td>
                    <span className="badge" style={{ background: getStatusColor(lead.status) }}>
                      {leadStatusToUiLabel(lead.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageSquare size={14} color="var(--text-muted)" />
                      <span>{lead.source}</span>
                    </div>
                  </td>
                  <td>{getTenantName(lead.tenantId)}</td>
                  <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
