'use client';

import {
  BedDouble,
  CheckCircle2,
  Home,
  ShieldCheck,
  Utensils,
  Wifi,
} from 'lucide-react';

type ServiceItem =
  | string
  | {
      name: string;
      description?: string;
    };

type Props = {
  services?: ServiceItem[];
};

type HostelService = {
  key: string;
  title: string;
  description: string;
  icon: typeof BedDouble;
  backendConnected: boolean;
};

const HOSTEL_SERVICE_CONFIG: Record<
  string,
  Omit<HostelService, 'key'>
> = {
  'room allocation': {
    title: 'Room Allocation',
    description:
      'Choose a suitable accommodation option based on room type and current availability.',
    icon: BedDouble,
    backendConnected: true,
  },

  mess: {
    title: 'Nutritious Food',
    description:
      'Convenient dining and food options designed for comfortable everyday hostel living.',
    icon: Utensils,
    backendConnected: true,
  },

  wifi: {
    title: 'High Speed Wi-Fi',
    description:
      'Stay connected for classes, study, communication, and everyday needs.',
    icon: Wifi,
    backendConnected: true,
  },

  security: {
    title: '24/7 Security',
    description:
      'A safe and monitored environment designed around comfortable student living.',
    icon: ShieldCheck,
    backendConnected: true,
  },

  housekeeping: {
    title: 'Housekeeping',
    description:
      'Regular care and maintenance to help keep the hostel environment clean and comfortable.',
    icon: Home,
    backendConnected: true,
  },

  maintenance: {
    title: 'Maintenance Support',
    description:
      'Support for maintaining comfortable and functional hostel facilities.',
    icon: CheckCircle2,
    backendConnected: true,
  },
};

const DEFAULT_HOSTEL_SERVICES: HostelService[] = [
  {
    key: 'wifi',
    title: 'High Speed Wi-Fi',
    description:
      'Stay connected for classes, study, communication, and everyday needs.',
    icon: Wifi,
    backendConnected: false,
  },
  {
    key: 'food',
    title: 'Nutritious Food',
    description:
      'Convenient food and dining options for comfortable everyday hostel life.',
    icon: Utensils,
    backendConnected: false,
  },
  {
    key: 'security',
    title: '24/7 Security',
    description:
      'A safe and monitored environment designed around student living.',
    icon: ShieldCheck,
    backendConnected: false,
  },
  {
    key: 'housekeeping',
    title: 'Housekeeping',
    description:
      'Regular care and maintenance to keep the hostel environment comfortable.',
    icon: Home,
    backendConnected: false,
  },
  {
    key: 'room-allocation',
    title: 'Room Allocation',
    description:
      'Choose an accommodation option based on room type and current availability.',
    icon: BedDouble,
    backendConnected: true,
  },
  {
    key: 'maintenance',
    title: 'Maintenance Support',
    description:
      'Support for maintaining comfortable and functional hostel facilities.',
    icon: CheckCircle2,
    backendConnected: false,
  },
];

function normalizeServiceName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getBackendService(
  service: ServiceItem,
): HostelService | null {
  const name =
    typeof service === 'string'
      ? service
      : String(service?.name || '');

  const normalizedName = normalizeServiceName(name);

  /*
   * Only explicitly supported Hostel services are allowed into
   * the Hostel theme.
   *
   * This prevents Default-theme services such as:
   * Home Visit
   * Consultation
   * from appearing here.
   */
  const config = HOSTEL_SERVICE_CONFIG[normalizedName];

  if (!config) {
    return null;
  }

  const customDescription =
    typeof service === 'object'
      ? service.description?.trim()
      : '';

  return {
    key: normalizedName,
    title: config.title,
    description:
      customDescription || config.description,
    icon: config.icon,
    backendConnected: config.backendConnected,
  };
}

export default function HostelServices({
  services = [],
}: Readonly<Props>) {
  /*
   * Convert only recognized backend Hostel services.
   *
   * Unknown/default-theme services are deliberately ignored instead
   * of being displayed under the Hostel theme.
   */
  const backendServices = services
    .map(getBackendService)
    .filter((service): service is HostelService => service !== null);

  /*
   * Remove duplicate services while preserving backend order.
   */
  const uniqueBackendServices = Array.from(
    new Map(
      backendServices.map((service) => [
        service.key,
        service,
      ]),
    ).values(),
  );

  /*
   * If no Hostel-specific services are available from the backend,
   * render useful Hostel UI instead of showing unrelated Default-theme
   * services.
   */
  const serviceList =
    uniqueBackendServices.length > 0
      ? uniqueBackendServices
      : DEFAULT_HOSTEL_SERVICES;

  return (
    <div className="rounded-[2rem] border border-[#E7E2D8] bg-white p-5 shadow-sm sm:p-7">
      {/* ============================================================
          HEADER
      ============================================================ */}
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1F6B48]">
          Hostel Facilities
        </p>

        <h2 className="mt-2 font-serif text-2xl font-bold tracking-[-0.03em] text-[#102033] sm:text-3xl">
          Facilities for comfortable living
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#536579]">
          Everything you need for a comfortable, convenient, and secure
          student stay.
        </p>
      </div>

      {/* ============================================================
          SERVICES
      ============================================================ */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serviceList.map((service) => {
          const Icon = service.icon;

          return (
            <article
              key={service.key}
              className="group rounded-3xl border border-[#E7E2D8] bg-[#FBFAF7] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3EC] text-[#1F6B48]">
                  <Icon size={21} />
                </div>

                {!service.backendConnected ? (
                  <span className="rounded-full border border-[#E7E2D8] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8A8F98]">
                    Coming Soon
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#1F6B48]">
                    <CheckCircle2 size={13} />
                    Available
                  </span>
                )}
              </div>

              <h3 className="mt-5 text-lg font-black text-[#102033]">
                {service.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#536579]">
                {service.description}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}