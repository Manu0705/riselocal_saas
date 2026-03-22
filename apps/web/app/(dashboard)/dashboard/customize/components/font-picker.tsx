'use client';

import { DEFAULT_TENANT_FONT, TENANT_FONT_OPTIONS, getFontFamily } from '@/lib/tenant-font';

type FontPickerProps = {
  value?: string;
  disabled?: boolean;
  onChange: (fontName: string) => void;
};

export default function FontPicker({ value, disabled = false, onChange }: Readonly<FontPickerProps>) {
  const selectedFont = value || DEFAULT_TENANT_FONT;

  return (
    <div>
      <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
        Typography
      </label>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        Font Family
      </label>

      <select
        value={selectedFont}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          border: '1px solid var(--card-border)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 14,
          background: 'var(--card)',
          color: 'var(--text)',
          opacity: disabled ? 0.75 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {TENANT_FONT_OPTIONS.map((fontName) => (
          <option key={fontName} value={fontName}>
            {fontName}
          </option>
        ))}
      </select>

      <p
        style={{
          margin: '10px 0 0',
          fontSize: 13,
          color: 'var(--muted)',
          fontFamily: getFontFamily(selectedFont),
        }}
      >
        The quick brown fox jumps over the lazy dog.
      </p>
    </div>
  );
}
