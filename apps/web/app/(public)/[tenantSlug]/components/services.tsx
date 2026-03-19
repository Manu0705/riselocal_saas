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

export default function Services({ services }: Readonly<Props>) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const list =
    services?.length
      ? services
      : ['Home Visit', 'Curtain Installation', 'Fabric Selection'];

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[var(--text)]">Services</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Browse what this tenant currently offers.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {list.length} items
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((service) => {
        const label = typeof service === 'string' ? service : String(service?.name || 'Service');
        const description =
          typeof service === 'string'
            ? serviceDescriptions[label]
            : service?.description || serviceDescriptions[label] || '';
        const isSelected = selectedService === label;

        return (
          <button
            key={label}
            type="button"
            onClick={() => setSelectedService(isSelected ? null : label)}
            className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:border-blue-200 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className={`m-0 text-base font-semibold ${isSelected ? 'text-blue-600' : 'text-[var(--text)]'}`}>
                {label}
              </h3>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {isSelected ? 'Open' : 'View'}
              </span>
            </div>
            {isSelected && (
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}
