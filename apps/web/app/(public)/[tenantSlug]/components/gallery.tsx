'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { capturePublicCtaLead, getLeadCapturePrefill } from '@/lib/public-lead-capture';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  resolveActionHref,
  type ActionButtonsConfig,
} from '@/lib/action-buttons';
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
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
        {skeletonCards.map((card) => (
          <div
            key={card}
            className="h-64 min-w-[calc(50%-0.5rem)] animate-pulse rounded-lg border border-gray-200 bg-gray-100 shadow-sm sm:min-w-0"
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
        <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((img) => (
            <button
              key={`${img.url}-${img.category}`}
              type="button"
              onClick={() => setSelectedImage({ url: img.url, category: toCategoryLabel(img.category) })}
              className="group relative h-64 min-w-[calc(50%-0.5rem)] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-left shadow-sm transition-all duration-300 hover:shadow-md sm:min-w-0"
            >
              <Image
                src={img.url}
                alt={img.alt || toCategoryLabel(img.category)}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                quality={65}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {toCategoryLabel(img.category)}
                  </p>
                  <p className="truncate text-xs text-white/80">
                    Tap to preview image
                  </p>
                </div>

                {buttons.whatsappEnquiry.enabled ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      enquiry(img.url, toCategoryLabel(img.category));
                    }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-green-600"
                  >
                    WhatsApp Enquiry
                  </button>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--text)]">Gallery</h2>
        <p className="text-sm text-[var(--muted)]">
          {showingFrom}-{showingTo} of {filtered.length}
        </p>
      </div>

      <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
        {categories.map((category) => {
          const isActive = active === category.key;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setActive(category.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          );
        })}
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
