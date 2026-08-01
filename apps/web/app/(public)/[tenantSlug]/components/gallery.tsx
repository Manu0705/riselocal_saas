'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { capturePublicCtaLead, getLeadCapturePrefill } from '@/lib/public-lead-capture';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  type ActionButtonsConfig,
} from '@saas/domain-core/tenant.contract';
import { resolveActionHref } from '@/lib/action-buttons';
import LeadCaptureModal from './lead-capture-modal';
import ImageViewerModal from './image-viewer-modal';

type GalleryImage = {
  url: string;
  category: string;
  alt?: string;
};

type Props = {
  images?: GalleryImage[];
  galleryCategories?: string[];
  tenantSlug: string;
  tenantId?: string;
  phone?: string;
  actionButtons?: ActionButtonsConfig;
};

export default function Gallery({
  images = [],
  galleryCategories = [],
  tenantSlug,
  phone,
  actionButtons,
}: Readonly<Props>) {
  const [active, setActive] = useState('');
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [pendingEnquiry, setPendingEnquiry] = useState<{ image: string; category: string } | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = useState<{ url: string; category: string } | null>(null);
  const buttons = actionButtons ? normalizeActionButtons(actionButtons) : DEFAULT_ACTION_BUTTONS;
  const prefill = getLeadCapturePrefill(tenantSlug);

  const toCategoryKey = (value: unknown) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  const toCategoryLabel = (value: string) =>
    value
      .trim()
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

  useEffect(() => {
    setShowSkeletons(true);
    const timeout = globalThis.setTimeout(() => {
      setShowSkeletons(false);
    }, 250);

    return () => globalThis.clearTimeout(timeout);
  }, [images, active]);

  function enquiry(image: string, category: string) {
    setPendingEnquiry({ image, category });
  }

  const categories = useMemo(() => {
    const ordered: Array<{ key: string; label: string }> = [];
    const seen = new Set<string>();

    const pushCategory = (value: unknown) => {
      const raw = typeof value === 'string' ? value.trim() : '';
      if (!raw) return;

      const key = toCategoryKey(raw);
      if (key === 'all') return;
      if (seen.has(key)) return;

      seen.add(key);
      ordered.push({ key, label: toCategoryLabel(raw) });
    };

    galleryCategories.forEach(pushCategory);

    // Respect tenant-configured categories first. If none are configured,
    // derive categories from image metadata as a fallback.
    if (ordered.length === 0) {
      images.forEach((image) => pushCategory(image.category));
    }

    return [...ordered, { key: 'all', label: 'All' }];
  }, [galleryCategories, images]);

  useEffect(() => {
    if (categories.length === 0) {
      setActive('all');
      return;
    }

    const activeExists = categories.some((category) => category.key === active);
    if (!active || !activeExists) {
      setActive(categories[0]?.key ?? 'all');
    }
  }, [categories, active]);

  const filtered = useMemo(() => {
    if (active === 'all') return images;
    return images.filter((img) => toCategoryKey(img.category) === active);
  }, [active, images]);

  const showingFrom = filtered.length === 0 ? 0 : 1;
  const showingTo = filtered.length;

  const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

  let content: ReactNode;

  if (showSkeletons) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skeletonCards.map((card) => (
          <div
            key={card}
            className="h-72 animate-pulse rounded-[1.75rem] border border-white/70 bg-slate-100 shadow-[0_20px_60px_rgba(148,163,184,0.08)]"
          />
        ))}
      </div>
    );
  } else if (filtered.length === 0) {
    content = (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
        No images found
      </div>
    );
  } else {
    content = (
      <>
        <div className="-mx-2 overflow-x-auto pb-2">
          <div className="flex gap-4 px-2">
            {filtered.map((img) => (
              <button
                key={`${img.url}-${img.category}`}
                type="button"
                onClick={() => setSelectedImage({ url: img.url, category: toCategoryLabel(img.category) })}
                className="group relative h-72 min-w-[45%] sm:min-w-[40%] lg:min-w-[36%] flex-shrink-0 overflow-hidden rounded-[1.75rem] border border-white/80 bg-slate-100 text-left shadow-[0_24px_68px_rgba(237,147,115,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_88px_rgba(237,147,115,0.18)]"
              >
              <Image
                src={img.url}
                alt={img.alt || toCategoryLabel(img.category)}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                quality={65}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {toCategoryLabel(img.category)}
                  </p>
                  <p className="truncate text-xs text-white/80">
                    View premium image
                  </p>
                </div>

                {buttons.whatsappEnquiry.enabled ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      enquiry(img.url, toCategoryLabel(img.category));
                    }}
                    className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-rose-600"
                  >
                    Enquire
                  </button>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
      </>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(244,174,160,0.12)] backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-rose-600">Signature gallery</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Beauty portfolio</h2>
        </div>
        <p className="text-sm text-slate-500">
          Showing {showingFrom}-{showingTo} of {filtered.length}
        </p>
      </div>

      <div className="mb-5 overflow-x-auto pb-2">
        <div className="flex flex-nowrap gap-3 px-2">
          {categories.map((category) => {
            const isActive = active === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setActive(category.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {content}

      <ImageViewerModal
        open={Boolean(selectedImage)}
        imageUrl={selectedImage?.url || ''}
        imageCategory={selectedImage?.category || ''}
        onClose={() => setSelectedImage(null)}
      />

      <LeadCaptureModal
        open={Boolean(pendingEnquiry)}
        title="Tell us where to respond"
        submitLabel="Continue to WhatsApp"
        defaultName={prefill?.name}
        defaultPhone={prefill?.phone}
        defaultLocation={pendingEnquiry?.category}
        onClose={() => setPendingEnquiry(null)}
        onSubmit={async ({ name, phone: submittedPhone, location }) => {
          if (!pendingEnquiry) return;

          const contextMessage = `Hi, I'm interested in this ${pendingEnquiry.category} design (${pendingEnquiry.image})`;
          const href = resolveActionHref(
            buttons.whatsappEnquiry,
            `https://wa.me/${phone}?text=${encodeURIComponent(contextMessage)}`,
            { whatsappMessage: contextMessage },
          );

          const response = await capturePublicCtaLead({
            tenantSlug,
            source: 'WhatsApp Enquiry',
            actionType: 'enquiry_click',
            name,
            phone: submittedPhone,
            location: location ? `Category: ${location}` : `Category: ${pendingEnquiry.category}`,
            pageUrl: globalThis.location.href,
            buttonId: 'gallery-whatsapp-enquiry',
          });

          if (!response.success) {
            throw new Error(response.message || 'Could not capture lead details');
          }

          setPendingEnquiry(null);
          globalThis.open(href, '_blank', 'noopener,noreferrer');
        }}
      />
    </div>
  );
}
