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
  const list =
    services?.length && services[0]
      ? services
      : ['Home Visit', 'Curtain Installation', 'Fabric Selection'];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(241,180,162,0.12)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(251,207,193,0.35),_transparent_60%)]" />
      <div className="relative mb-6 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.32em] text-rose-600">Signature Services</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Premium salon offerings</h2>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Discover the luxury treatments we bring to every guest — tailored, polished, and thoughtfully delivered.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((service) => {
          const label = typeof service === 'string' ? service : String(service?.name || 'Service');
          const description =
            typeof service === 'string'
              ? serviceDescriptions[label]
              : service?.description || serviceDescriptions[label] || '';

          return (
            <div
              key={label}
              className="group rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(238,149,123,0.14)]"
            >
              <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {description || 'Enjoy a premium experience designed to leave you looking refreshed and radiant.'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
