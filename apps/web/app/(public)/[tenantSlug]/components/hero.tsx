import { ChevronRight, Globe, MapPin } from 'lucide-react';

type Props = {
  readonly tenant: {
    readonly name?: string;
    readonly tagline?: string;
    readonly phone?: string;
    readonly whatsapp?: string;
    readonly logoUrl?: string;
    readonly bannerUrl?: string;
    readonly logoShape?: string;
    readonly address?: string;
    readonly instagram?: string;
    readonly facebook?: string;
    readonly website?: string;
    readonly socialLinks?: Array<{ platform?: string; url?: string; label?: string }>;
  };
};

export default function Hero({ tenant }: Props) {
  const phone = tenant?.phone ?? '';

  const withProtocol = (url?: string) => {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const mappedLinks = (tenant?.socialLinks ?? [])
    .map((link) => ({
      label: link?.label || link?.platform || 'Link',
      href: withProtocol(link?.url),
      icon: <Globe size={16} />,
    }))
    .filter((item) => Boolean(item.href));

  const tenantSocialLinks = mappedLinks.length
    ? mappedLinks
    : [
        { label: 'Instagram', href: withProtocol(tenant?.instagram), icon: <Globe size={16} /> },
        { label: 'Facebook', href: withProtocol(tenant?.facebook), icon: <Globe size={16} /> },
        { label: 'Website', href: withProtocol(tenant?.website), icon: <Globe size={16} /> },
      ].filter((item) => Boolean(item.href));

  const dummySocialLinks = [
    { label: 'Instagram', href: 'https://instagram.com', icon: <Globe size={16} /> },
    { label: 'Facebook', href: 'https://facebook.com', icon: <Globe size={16} /> },
    { label: 'Website', href: 'https://example.com', icon: <Globe size={16} /> },
  ];

  const socialLinks = tenantSocialLinks.length ? tenantSocialLinks : dummySocialLinks;

  return (
    <div className="px-4 py-4">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Slide 1: Banner */}
        <section className="min-w-full snap-start overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm">
          <img
            src={
              tenant?.bannerUrl ||
              'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80&auto=format&fit=crop'
            }
            alt="Business banner"
            className="block h-48 w-full object-cover sm:h-56"
          />
          <div className="space-y-2 p-4">
            <div className="text-base font-bold text-[var(--text)] sm:text-lg">
              {tenant?.name || 'Business Banner'}
            </div>
            <p className="m-0 text-sm leading-6 text-[var(--muted)]">
              {tenant?.tagline || 'Premium curtains and blinds for your home.'}
            </p>
          </div>
        </section>

        {/* Slide 2: Visiting Card Details */}
        <section className="min-w-full snap-start rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-[var(--text)]">
            <MapPin size={16} />
            Visiting Card Details
          </div>

          <div className="grid gap-2 rounded-xl border border-[var(--card-border)] bg-black/[0.02] p-4">
            <div className="text-base font-bold text-[var(--text)]">
              {tenant?.name || 'Business Name'}
            </div>

            <div className="text-sm text-[var(--muted)]">
              {tenant?.tagline || 'Your business tagline'}
            </div>

            <div className="text-sm text-[var(--text)]">
              <strong>Phone:</strong> {phone || 'N/A'}
            </div>

            <div className="text-sm text-[var(--text)]">
              <strong>Address:</strong> {tenant?.address || 'Home visit available in nearby areas'}
            </div>

            <div className="text-sm text-[var(--text)]">
              <strong>Hours:</strong> 10:00 AM - 8:00 PM
            </div>
          </div>
        </section>

        {/* Slide 3: Social Links */}
        <section className="min-w-full snap-start rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="mb-3 text-sm font-bold tracking-wide text-[var(--text)]">Social Media</div>

          <div className="grid gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] px-3 py-3 text-[var(--text)] no-underline transition hover:border-[var(--tenant-primary,#2563eb)] hover:bg-blue-50/50"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronRight size={16} />
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--card-border)]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--card-border)]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--card-border)]" />
      </div>
    </div>
  );
}
