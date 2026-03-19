'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pencil, Save, Trash2 } from 'lucide-react';
import CustomizePanelSkeleton from './customize-panel-skeleton';
import PageErrorState from '@/components/page-error-state';
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
  showMessage?: boolean;
};

const BUTTONS: ButtonMeta[] = [
  { key: 'chatWhatsApp', title: 'Chat on WhatsApp', sourceTag: 'Quick Actions + Contact', showMessage: true },
  { key: 'call', title: 'Call Button', sourceTag: 'Quick Actions + Contact' },
  { key: 'whatsappEnquiry', title: 'WhatsApp Enquiry', sourceTag: 'Gallery Images', showMessage: true },
];

export default function ActionButtonsManager() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [buttons, setButtons] = useState<ActionButtonsConfig>(DEFAULT_ACTION_BUTTONS);
  const [savedButtons, setSavedButtons] = useState<ActionButtonsConfig>(DEFAULT_ACTION_BUTTONS);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/settings');
      if (response?.success === false) {
        throw new Error(response?.message || response?.error || 'Failed to load action button settings');
      }
      const data = (response?.data || {}) as SettingsResponse;
      const normalized = normalizeActionButtons(data.actionButtons);
      setButtons(normalized);
      setSavedButtons(normalized);
      setLoadError(null);
    } catch (error) {
      console.error('Failed to load action button settings:', error);
      setButtons(DEFAULT_ACTION_BUTTONS);
      setSavedButtons(DEFAULT_ACTION_BUTTONS);
      setLoadError(error instanceof Error ? error.message : 'Failed to load action button settings');
    } finally {
      setLoading(false);
    }
  };

  const updateButton = (key: ActionButtonKey, field: 'enabled' | 'phone' | 'message', value: string | boolean) => {
    setButtons((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const focusCard = (key: ActionButtonKey) => {
    const element = globalThis.document?.getElementById(`action-button-card-${key}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const savedRecords = BUTTONS.filter((meta) => {
    const config = savedButtons[meta.key];
    return Boolean(config.phone || (meta.showMessage && config.message));
  });

  const persistButtons = async (nextButtons: ActionButtonsConfig) => {
    setSaving(true);
    try {
      const api = getTenantApiClient();
      const response = await api.put('/settings', {
        actionButtons: nextButtons,
      });

      if (response?.success === false) {
        throw new Error(response?.message || response?.error || 'Failed to save settings');
      }

      if (response?.data) {
        const data = response.data as SettingsResponse;
        const normalized = normalizeActionButtons(data.actionButtons);
        setButtons(normalized);
        setSavedButtons(normalized);
        setStatusSuccess('Action button settings saved');
        globalThis.setTimeout(() => setStatusSuccess(null), 2500);
      } else {
        throw new Error('Unexpected response while saving action buttons');
      }
    } catch (error) {
      console.error('Failed to save action button settings:', error);
      setStatusError(
        error instanceof Error ? error.message : 'Failed to save Action Buttons settings. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    await persistButtons(buttons);
  };

  const clearRecord = async (key: ActionButtonKey) => {
    const nextButtons: ActionButtonsConfig = {
      ...buttons,
      [key]: {
        ...buttons[key],
        phone: undefined,
        message: undefined,
      },
    };

    setButtons(nextButtons);
    await persistButtons(nextButtons);
  };

  if (loading) {
    return <CustomizePanelSkeleton title="Loading action button settings..." />;
  }

  if (loadError) {
    return (
      <PageErrorState
        title="Action button settings could not be loaded"
        message={loadError}
        retryLabel="Retry action buttons"
        onRetry={() => {
          setLoading(true);
          void loadSettings();
        }}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {statusError ? (
        <div
          style={{
            border: '1px solid #fca5a5',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
          }}
        >
          {statusError}
        </div>
      ) : null}
      {statusSuccess ? (
        <div
          style={{
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#16a34a',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
          }}
        >
          {statusSuccess}
        </div>
      ) : null}

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
          Control which public CTA buttons are shown and customize their phone numbers and messages.
        </p>
      </div>

      {BUTTONS.map((meta) => {
        const config = buttons[meta.key];

        return (
          <div
            id={`action-button-card-${meta.key}`}
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
              placeholder="Phone number (digits only, optional)"
              value={config.phone || ''}
              onChange={(event) => updateButton(meta.key, 'phone', event.target.value)}
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />

            {meta.showMessage && (
              <input
                type="text"
                placeholder="Pre-filled message (optional)"
                value={config.message || ''}
                onChange={(event) => updateButton(meta.key, 'message', event.target.value)}
                style={{
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                }}
              />
            )}
          </div>
        );
      })}

      <button
        type="button"
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

      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gap: 10,
        }}
      >
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Saved Action Button Records</h4>
        {savedRecords.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            No saved phone/message records yet.
          </p>
        ) : (
          savedRecords.map((meta) => {
            const config = savedButtons[meta.key];
            return (
              <div
                key={`saved-${meta.key}`}
                style={{
                  border: '1px solid var(--card-border)',
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{meta.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Phone: {config.phone || '-'}
                  </div>
                  {meta.showMessage ? (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Message: {config.message || '-'}
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => focusCard(meta.key)}
                    style={{
                      border: '1px solid var(--card-border)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--text)',
                      width: 32,
                      height: 32,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => {
                      void clearRecord(meta.key);
                    }}
                    style={{
                      border: '1px solid #ef4444',
                      borderRadius: 8,
                      background: 'transparent',
                      color: '#ef4444',
                      width: 32,
                      height: 32,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
