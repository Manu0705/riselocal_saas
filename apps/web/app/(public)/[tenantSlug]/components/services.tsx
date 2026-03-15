'use client';

import { useState } from 'react';

type Props = {
  services?: Array<string | { name: string; description?: string }>;
};

const serviceDescriptions: Record<string, string> = {
  'Home Visit':
    'Our team will visit your home to understand your requirements and take measurements.',
  'Curtain Installation': 'Professional installation of your curtains with precision and care.',
  'Fabric Selection':
    'Choose from our wide range of premium fabrics and designs tailored to your style.',
};

export default function Services({ services }: Props) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const list =
    services && services.length
      ? services
      : ['Home Visit', 'Curtain Installation', 'Fabric Selection'];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 10 }}>Services</h2>

      {list.map((service, i) => {
        const label = typeof service === 'string' ? service : String(service?.name || 'Service');
        const description =
          typeof service === 'string'
            ? serviceDescriptions[label]
            : service?.description || serviceDescriptions[label] || '';
        const isSelected = selectedService === label;

        return (
          <button
            key={i}
            onClick={() => setSelectedService(isSelected ? null : label)}
            style={{
              width: '100%',
              border: isSelected ? '1px solid #3b82f6' : '1px solid #eee',
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
              background: isSelected ? '#eff6ff' : '#fafafa',
              textAlign: 'center',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: isSelected ? '#3b82f6' : '#000',
              }}
            >
              {label}
            </h3>
            {isSelected && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#666', lineHeight: 1.4 }}>
                {description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
