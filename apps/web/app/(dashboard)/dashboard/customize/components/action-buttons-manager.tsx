'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getTenantApiClient } from '@/lib/tenant-client';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  type ActionButtonKey,
  type ActionButtonsConfig,
} from '@/lib/action-buttons';

type SettingsResponse = {
  sectionOrder?: string[];
  actionButtons?: ActionButtonsConfig;
};

type ButtonMeta = {
  key: ActionButtonKey;
  title: string;
  sourceTag: string;
};

const BUTTONS: ButtonMeta[] = [
  { key: 'chatWhatsApp', title: 'Chat on WhatsApp', sourceTag: 'Quick Actions + Contact' },
  { key: 'call', title: 'Call Button', sourceTag: 'Quick Actions + Contact' },
  { key: 'whatsappEnquiry', title: 'WhatsApp Enquiry', sourceTag: 'Gallery Images' },
  { key: 'confirmBooking', title: 'Confirm Booking', sourceTag: 'Booking Form' },
];

export default function ActionButtonsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(['hero', 'services', 'gallery']);
  const [buttons, setButtons] = useState<ActionButtonsConfig>(DEFAULT_ACTION_BUTTONS);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/settings');
      const data = (response?.data || {}) as SettingsResponse;

      setSectionOrder(Array.isArray(data.sectionOrder) ? data.sectionOrder : ['hero', 'services', 'gallery']);
      setButtons(normalizeActionButtons(data.actionButtons));
    } catch (error) {
      console.error('Failed to load action button settings:', error);
      setButtons(DEFAULT_ACTION_BUTTONS);
    } finally {
      setLoading(false);
    }
  };

  const updateButton = (key: ActionButtonKey, field: 'enabled' | 'label' | 'phone' | 'url', value: string | boolean) => {
    setButtons((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const api = getTenantApiClient();
      const response = await api.put('/settings', {
        sectionOrder,
        actionButtons: buttons,
      });

      if (response?.data) {
        const data = response.data as SettingsResponse;
        setSectionOrder(Array.isArray(data.sectionOrder) ? data.sectionOrder : sectionOrder);
        setButtons(normalizeActionButtons(data.actionButtons));
      }
    } catch (error) {
      console.error('Failed to save action button settings:', error);
      alert('Failed to save Action Buttons settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
        <Loader2 size={24} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12 }}>Loading action button settings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Action Buttons</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Control which public CTA buttons are shown and customize their labels, phone numbers, and links.
        </p>
      </div>

      {BUTTONS.map((meta) => {
        const config = buttons[meta.key];

        return (
          <div
            key={meta.key}
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              borderRadius: 12,
              padding: 16,
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{meta.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Used in: {meta.sourceTag}</div>
              </div>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: config.enabled ? '#16a34a' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(event) => updateButton(meta.key, 'enabled', event.target.checked)}
                />
                {config.enabled ? 'Enabled' : 'Disabled'}
              </label>
            </div>

            <input
              type="text"
              placeholder="Button label"
              value={config.label || ''}
              onChange={(event) => updateButton(meta.key, 'label', event.target.value)}
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />

            <input
              type="text"
              placeholder="Phone override (digits only, optional)"
              value={config.phone || ''}
              onChange={(event) => updateButton(meta.key, 'phone', event.target.value)}
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />

            <input
              type="url"
              placeholder="Custom URL override (optional)"
              value={config.url || ''}
              onChange={(event) => updateButton(meta.key, 'url', event.target.value)}
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />
          </div>
        );
      })}

      <button
        onClick={saveSettings}
        disabled={saving}
        style={{
          border: 'none',
          background: '#3b82f6',
          color: '#fff',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 14,
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.75 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Action Buttons'}
      </button>
    </div>
  );
}
