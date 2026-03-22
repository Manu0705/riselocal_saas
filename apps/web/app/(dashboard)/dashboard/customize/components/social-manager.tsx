'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import CustomizePanelSkeleton from './customize-panel-skeleton';
import PageErrorState from '@/components/page-error-state';
import { getTenantApiClient } from '@/lib/tenant-client';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label?: string;
}

const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'website', label: 'Website' },
];

export default function SocialLinksManager() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ platform: 'facebook', url: '', label: '' });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/social');
      if (response?.data) {
        setLinks(response.data);
      }
      setLoadError(null);
    } catch (error) {
      console.error('Failed to load social links:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.url.trim()) {
      setStatusError('URL is required');
      return;
    }

    // Check if platform already exists
    if (links.some((link) => link.platform === formData.platform)) {
      setStatusError(`${formData.platform} link already exists. Edit the existing one instead.`);
      return;
    }

    try {
      setStatusError(null);
      const api = getTenantApiClient();
      const response = await api.post('/social', formData);
      if (response?.data) {
        setLinks([...links, response.data]);
        setFormData({ platform: 'facebook', url: '', label: '' });
        setStatusSuccess('Social link added successfully');
        globalThis.setTimeout(() => setStatusSuccess(null), 2500);
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      setStatusError(error instanceof Error ? error.message : 'Failed to create link');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.url.trim()) {
      setStatusError('URL is required');
      return;
    }

    try {
      setStatusError(null);
      const api = getTenantApiClient();
      const response = await api.put(`/social/${id}`, {
        url: formData.url,
        label: formData.label,
      });
      if (response?.data) {
        setLinks(links.map((link) => (link.id === id ? response.data : link)));
        setEditingId(null);
        setFormData({ platform: 'facebook', url: '', label: '' });
        setStatusSuccess('Social link updated successfully');
        globalThis.setTimeout(() => setStatusSuccess(null), 2500);
      }
    } catch (error) {
      console.error('Failed to update link:', error);
      setStatusError(error instanceof Error ? error.message : 'Failed to update link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this social link?')) return;

    try {
      setStatusError(null);
      const api = getTenantApiClient();
      await api.delete(`/social/${id}`);
      setLinks(links.filter((link) => link.id !== id));
      setStatusSuccess('Social link deleted successfully');
      globalThis.setTimeout(() => setStatusSuccess(null), 2500);
    } catch (error) {
      console.error('Failed to delete link:', error);
      setStatusError(error instanceof Error ? error.message : 'Failed to delete link');
    }
  };

  const startEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setFormData({
      platform: link.platform,
      url: link.url,
      label: link.label || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ platform: 'facebook', url: '', label: '' });
  };

  const getPlatformLabel = (platform: string) => {
    return platforms.find((p) => p.value === platform)?.label || platform;
  };

  if (loading) {
    return <CustomizePanelSkeleton title="Loading social links..." />;
  }

  if (loadError) {
    return (
      <PageErrorState
        title="Social links could not be loaded"
        message={loadError}
        retryLabel="Retry social links"
        onRetry={() => {
          setLoading(true);
          void loadLinks();
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

      {/* Add/Edit Form */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          {editingId ? 'Edit Social Link' : 'Add Social Link'}
        </h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <select
            aria-label="Select social platform"
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            disabled={!!editingId}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              background: 'var(--card)',
              cursor: editingId ? 'not-allowed' : 'pointer',
              opacity: editingId ? 0.6 : 1,
            }}
          >
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
          <input
            type="url"
            placeholder="Profile URL *"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
            }}
          />
          <input
            type="text"
            placeholder="Custom label (optional)"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdate(editingId)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="Cancel editing social link"
                  title="Cancel"
                  style={{
                    border: '1px solid var(--card-border)',
                    background: 'transparent',
                    borderRadius: 8,
                    padding: '10px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  flex: 1,
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Plus size={16} />
                Add Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Links List */}
      {links.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <p>No social links added yet</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Add your first social media link above</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {links.map((link) => (
            <div
              key={link.id}
              style={{
                border: '1px solid var(--card-border)',
                background: 'var(--card)',
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#3b82f6',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {getPlatformLabel(link.platform)}
                  </span>
                  {link.label && (
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>• {link.label}</span>
                  )}
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'block',
                    maxWidth: '100%',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    lineHeight: 1.35,
                  }}
                >
                  {link.url}
                </a>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => startEdit(link)}
                  aria-label={`Edit ${getPlatformLabel(link.platform)} link`}
                  title="Edit"
                  style={{
                    border: 'none',
                    background: '#eff6ff',
                    color: '#3b82f6',
                    borderRadius: 6,
                    padding: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  aria-label={`Delete ${getPlatformLabel(link.platform)} link`}
                  title="Delete"
                  style={{
                    border: 'none',
                    background: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: 6,
                    padding: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
