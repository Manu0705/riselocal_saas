'use client';

import { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { getTenantApiClient } from '@/lib/tenant-client';

interface TenantSettings {
  id: string;
  logoUrl?: string;
  bannerUrl?: string;
  logoShape: 'circle' | 'square';
  primaryColor: string;
  secondaryColor: string;
  tagline?: string;
  businessPhone?: string;
  businessWhatsApp?: string;
}

export default function BrandingEditor() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [pending, setPending] = useState<Partial<TenantSettings>>({}); // unsaved field changes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Merge pending into settings for display
  const displayed: TenantSettings | null = settings
    ? { ...settings, ...pending }
    : null;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/settings');
      if (response?.success === false) {
        setError(response?.message || response?.error || 'Failed to load settings');
      } else if (response?.data) {
        setSettings(response.data);
        setPending({});
        setError(null);
      } else if (response?.error) {
        setError(response.error);
      } else {
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (type: 'logo' | 'banner', file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|gif|img)$/i)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    setUploading(type);
    setError(null);
    setSuccess(null);
    try {
      const api = getTenantApiClient();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadResponse?.success === false) {
        setError(uploadResponse?.message || uploadResponse?.error || `Failed to upload ${type}`);
      } else if (uploadResponse?.url) {
        const fieldName = type === 'logo' ? 'logoUrl' : 'bannerUrl';
        const updateResponse = await api.put('/settings', {
          [fieldName]: uploadResponse.url,
        });

        if (updateResponse?.success === false) {
          setError(updateResponse?.message || updateResponse?.error || 'Failed to save uploaded image');
        } else if (updateResponse?.data) {
          setSettings(updateResponse.data);
          setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Unexpected response while saving image settings');
        }
      } else if (uploadResponse?.error) {
        setError(uploadResponse.error);
      } else {
        setError(`Unexpected upload response for ${type}`);
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      setError(error instanceof Error ? error.message : `Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const handleUpdate = async (updates: Partial<TenantSettings>) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const api = getTenantApiClient();
      const response = await api.put('/settings', updates);
      if (response?.success === false) {
        setError(response?.message || response?.error || 'Failed to save changes');
      } else if (response?.data) {
        setSettings(response.data);
        setPending({});
        setSuccess('Changes saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else if (response?.error) {
        setError(response.error);
      } else {
        setError('Unexpected response while saving settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Save all pending field changes (shape, colors, tagline, contact)
  const handleSaveAll = () => {
    if (!displayed) return;
    const { logoUrl: _l, bannerUrl: _b, id: _id, ...saveable } = displayed;
    void handleUpdate(saveable);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
        <Loader2 size={24} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12 }}>Loading settings...</p>
      </div>
    );
  }

  if (!settings || !displayed) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#dc2626', fontSize: 14 }}>
          {error || 'Failed to load settings'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Status Messages */}
      {error && (
        <div
          style={{
            border: '1px solid #fca5a5',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#16a34a',
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
          }}
        >
          {success}
        </div>
      )}

      {/* Logo Upload */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Logo
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo"
              style={{
                width: 64,
                height: 64,
                objectFit: 'cover',
                borderRadius: displayed.logoShape === 'circle' ? '50%' : 8,
                border: '2px solid var(--card-border)',
              }}
            />
          )}
          <label
            style={{
              flex: 1,
              border: '2px dashed var(--card-border)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            {uploading === 'logo' ? (
              <Loader2 size={20} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <Upload size={20} style={{ marginBottom: 4 }} />
                <div>Click to upload logo</div>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.img"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleImageUpload('logo', e.target.files[0])}
            />
          </label>
        </div>

        {/* Logo Shape */}
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Logo Shape
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['circle', 'square'] as const).map((shape) => (
              <button
                type="button"
                key={shape}
                onClick={() => setPending((p) => ({ ...p, logoShape: shape }))}
                style={{
                  flex: 1,
                  border:
                    displayed.logoShape === shape
                      ? '2px solid #3b82f6'
                      : '1px solid var(--card-border)',
                  background: displayed.logoShape === shape ? '#eff6ff' : 'transparent',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: displayed.logoShape === shape ? '#3b82f6' : 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner Upload */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Banner Image
        </label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--muted)' }}>
          Recommended: 1200 &times; 400 px (3:1 ratio) &mdash; JPEG, PNG, or WebP
        </p>
        {settings.bannerUrl && (
          <img
            src={settings.bannerUrl}
            alt="Banner"
            style={{
              width: '100%',
              height: 120,
              objectFit: 'cover',
              borderRadius: 8,
              marginBottom: 12,
              border: '1px solid var(--card-border)',
            }}
          />
        )}
        <label
          style={{
            display: 'block',
            border: '2px dashed var(--card-border)',
            borderRadius: 8,
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          {uploading === 'banner' ? (
            <Loader2 size={20} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <Upload size={20} style={{ marginBottom: 4 }} />
              <div>Click to upload banner</div>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.img"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleImageUpload('banner', e.target.files[0])}
          />
        </label>
      </div>

      {/* Colors */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Brand Colors
        </label>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Primary Color
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={displayed.primaryColor}
                onChange={(e) => setPending((p) => ({ ...p, primaryColor: e.target.value }))}
                style={{
                  width: 48,
                  height: 48,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={displayed.primaryColor}
                onChange={(e) => setPending((p) => ({ ...p, primaryColor: e.target.value }))}
                style={{
                  flex: 1,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Secondary Color
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={displayed.secondaryColor}
                onChange={(e) => setPending((p) => ({ ...p, secondaryColor: e.target.value }))}
                style={{
                  width: 48,
                  height: 48,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={displayed.secondaryColor}
                onChange={(e) => setPending((p) => ({ ...p, secondaryColor: e.target.value }))}
                style={{
                  flex: 1,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Business Tagline
        </label>
        <input
          type="text"
          value={displayed.tagline || ''}
          onChange={(e) => setPending((p) => ({ ...p, tagline: e.target.value }))}
          placeholder="e.g., Your trusted home service provider"
          style={{
            width: '100%',
            border: '1px solid var(--card-border)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
          }}
        />
      </div>

      {/* Contact Info */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Contact Information
        </label>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Business Phone
            </label>
            <input
              type="tel"
              value={displayed.businessPhone || ''}
              onChange={(e) => setPending((p) => ({ ...p, businessPhone: e.target.value }))}
              placeholder="+1 234 567 8900"
              style={{
                width: '100%',
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              WhatsApp Number
              <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                (used for Chat on WhatsApp &amp; WhatsApp Enquiry buttons on public page)
              </span>
            </label>
            <input
              type="tel"
              value={displayed.businessWhatsApp || ''}
              onChange={(e) => setPending((p) => ({ ...p, businessWhatsApp: e.target.value }))}
              placeholder="+1 234 567 8900"
              style={{
                width: '100%',
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </div>

      {/* Save All Changes Button */}
      <button
        type="button"
        onClick={handleSaveAll}
        disabled={saving || Object.keys(pending).length === 0}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: saving || Object.keys(pending).length === 0 ? 'var(--card-border)' : '#3b82f6',
          color: saving || Object.keys(pending).length === 0 ? 'var(--muted)' : 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: saving || Object.keys(pending).length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 0.2s',
        }}
      >
        {saving ? (
          <>
            <Loader2 size={16} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}
