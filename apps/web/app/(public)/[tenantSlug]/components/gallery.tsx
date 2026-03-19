'use client';

import { useEffect, useRef, useState } from 'react';
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
  tenantId,
  phone,
  actionButtons,
}: Readonly<Props>) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const chipScrollRef = useRef<HTMLDivElement | null>(null);

  const [active, setActive] = useState('All');
  const [isInView, setIsInView] = useState(false);
  const [hasTouchedCategory, setHasTouchedCategory] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pendingEnquiry, setPendingEnquiry] = useState<{ image: string; category: string } | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = useState<{ url: string; category: string } | null>(null);
  const buttons = actionButtons ? normalizeActionButtons(actionButtons) : DEFAULT_ACTION_BUTTONS;
  const prefill = getLeadCapturePrefill(tenantSlug);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const updateScrollProgress = () => {
    const row = chipScrollRef.current;
    if (!row) return;

    const maxScroll = row.scrollWidth - row.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }

    setScrollProgress(Math.min(1, Math.max(0, row.scrollLeft / maxScroll)));
  };

  function enquiry(image: string, category: string) {
    setPendingEnquiry({ image, category });
  }

  const configuredCategories = Array.from(
    new Set(
      galleryCategories
        .map((category) => String(category).trim())
        .filter((category) => category.length > 0),
    ),
  );
  const uniqueImageCategories = Array.from(new Set(images.map((i) => i.category)));
  const categories = [...new Set([...configuredCategories, ...uniqueImageCategories]), 'All'];

  const filtered = active === 'All' ? images : images.filter((img) => img.category === active);

  const activeIndex = Math.max(0, categories.indexOf(active));
  const maxIndex = Math.max(1, categories.length - 1);
  const selectionProgress = activeIndex / maxIndex;

  const shouldShowTraversal = isInView && hasTouchedCategory;
  const traversalProgress = shouldShowTraversal
    ? Math.max(0.02, selectionProgress, scrollProgress)
    : 0;
  const traversalDegrees = Math.round(traversalProgress * 360);

  return (
    <div ref={sectionRef} style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Gallery</h2>

      {/* Category scroll activates after touching a chip in view */}
      <div
        style={{
          marginBottom: 16,
          borderRadius: 14,
          border: '1.5px solid transparent',
          background: shouldShowTraversal
            ? `linear-gradient(var(--card), var(--card)) padding-box, conic-gradient(from 225deg, #10b981 0deg, #10b981 ${traversalDegrees}deg, var(--card-border) ${traversalDegrees}deg 360deg) border-box`
            : 'transparent',
          boxShadow: 'none',
          transition: 'background 220ms ease',
        }}
      >
        <div
          ref={chipScrollRef}
          onScroll={updateScrollProgress}
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: 8,
            borderRadius: 12.5,
            background: 'transparent',
            border: '1px solid transparent',
            transition: 'border-color 220ms ease',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActive(cat);
                if (isInView) {
                  setHasTouchedCategory(true);
                  requestAnimationFrame(updateScrollProgress);
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid var(--card-border)',
                background: active === cat ? '#2563eb' : 'transparent',
                color: active === cat ? '#ffffff' : 'var(--text)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <p style={{ color: 'var(--muted)', margin: 0 }}>No images available in this category.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {filtered.map((img) => (
            <button
              key={`${img.url}-${img.category}`}
              type="button"
              onClick={() => setSelectedImage({ url: img.url, category: img.category })}
              style={{
                height: 200,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                backgroundImage: `url(${img.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                border: 'none',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
            {/* Button inside image */}
            {buttons.whatsappEnquiry.enabled && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  enquiry(img.url, img.category);
                }}
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  right: 10,
                  padding: '10px',
                  borderRadius: 8,
                  border: '1.5px solid #fff',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                WhatsApp Enquiry
              </button>
            )}
            </button>
          ))}
        </div>
      )}

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
