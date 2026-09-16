'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Images,
  Maximize2,
  X,
} from 'lucide-react';

import {
  capturePublicCtaLead,
  getLeadCapturePrefill,
} from '@/lib/public-lead-capture';

import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  type ActionButtonsConfig,
} from '@saas/domain-core/tenant.contract';

import { resolveActionHref } from '@/lib/action-buttons';

import LeadCaptureModal from '../../components/lead-capture-modal';
import ImageViewerModal from '../../components/image-viewer-modal';

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

function categoryKey(value: unknown) {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
}

function categoryLabel(value: string) {
  return value
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
    .join(' ');
}

export default function HostelGallery({
  images = [],
  galleryCategories = [],
  tenantSlug,
  phone,
  actionButtons,
}: Readonly<Props>) {
  const [showGallery, setShowGallery] = useState(false);

  const [activeCategory, setActiveCategory] = useState('all');

  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    category: string;
  } | null>(null);

  const [pendingEnquiry, setPendingEnquiry] = useState<{
    image: string;
    category: string;
  } | null>(null);

  const buttons = actionButtons
    ? normalizeActionButtons(actionButtons)
    : DEFAULT_ACTION_BUTTONS;

  const prefill = getLeadCapturePrefill(tenantSlug);

  /*
   * Build categories from the tenant/backend data.
   *
   * Nothing related to the Default/SALON theme is hardcoded here.
   */
  const categories = useMemo(() => {
    const result: Array<{
      key: string;
      label: string;
    }> = [];

    const seen = new Set<string>();

    const addCategory = (value: unknown) => {
      if (typeof value !== 'string') return;

      const raw = value.trim();

      if (!raw) return;

      const key = categoryKey(raw);

      if (!key || key === 'all' || seen.has(key)) {
        return;
      }

      seen.add(key);

      result.push({
        key,
        label: categoryLabel(raw),
      });
    };

    galleryCategories.forEach(addCategory);

    /*
     * If explicit gallery categories aren't configured,
     * derive them from the actual gallery images.
     */
    if (result.length === 0) {
      images.forEach((image) => addCategory(image.category));
    }

    return result;
  }, [galleryCategories, images]);

  /*
   * Make sure the active category remains valid if the backend
   * gallery configuration changes.
   */
  useEffect(() => {
    if (activeCategory === 'all') return;

    const exists = categories.some(
      (category) => category.key === activeCategory,
    );

    if (!exists) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') {
      return images;
    }

    return images.filter(
      (image) =>
        categoryKey(image.category) === activeCategory,
    );
  }, [activeCategory, images]);

  /*
   * The reference design has a single large gallery preview.
   *
   * Use the first real backend image as the hero image.
   * No fake gallery data is inserted.
   */
  const featuredImage = images[0];

  const secondaryImages = images.slice(1, 4);

  const handleGalleryOpen = () => {
    setShowGallery(true);
    setActiveCategory('all');
  };

  const handleGalleryClose = () => {
    setShowGallery(false);
  };

  const handleEnquire = (
    image: GalleryImage,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();

    setPendingEnquiry({
      image: image.url,
      category: categoryLabel(image.category),
    });
  };

  return (
    <>
      {/* ============================================================
          COMPACT GALLERY PREVIEW
      ============================================================ */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#E7E2D8] bg-white shadow-sm">
        <div className="relative h-[330px] overflow-hidden sm:h-[380px]">
          {featuredImage?.url ? (
            <>
              <Image
                src={featuredImage.url}
                alt={
                  featuredImage.alt ||
                  categoryLabel(featuredImage.category) ||
                  'Hostel gallery'
                }
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                quality={80}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-[#E8F3EC]">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1F6B48] shadow-sm">
                  <Images size={28} />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#536579]">
                  Gallery coming soon
                </p>
              </div>
            </div>
          )}

          {/* Gallery text */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/80">
              Our Gallery
            </p>

            <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
              Take a look at our spaces
            </h2>

            <button
              type="button"
              onClick={handleGalleryOpen}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#102033] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              View Gallery
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Small preview thumbnails */}
        {secondaryImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 border-t border-[#E7E2D8] bg-[#FBFAF7] p-2">
            {secondaryImages.map((image, index) => (
              <button
                key={`${image.url}-${image.category}-${index}`}
                type="button"
                onClick={() =>
                  setSelectedImage({
                    url: image.url,
                    category: categoryLabel(image.category),
                  })
                }
                className="group relative h-20 overflow-hidden rounded-xl sm:h-24"
              >
                <Image
                  src={image.url}
                  alt={
                    image.alt ||
                    categoryLabel(image.category)
                  }
                  fill
                  sizes="(max-width: 640px) 33vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />

                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#102033] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <Maximize2 size={13} />
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {/* ============================================================
          FULL GALLERY MODAL
      ============================================================ */}
      {showGallery ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#102033]/75 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto min-h-full w-full max-w-6xl">
            <div className="overflow-hidden rounded-[2rem] bg-[#FBFAF7] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E7E2D8] bg-white px-5 py-4 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1F6B48]">
                    Our Gallery
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-bold text-[#102033]">
                    Explore our hostel
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleGalleryClose}
                  aria-label="Close gallery"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E2D8] bg-white text-[#102033] transition-colors hover:bg-[#FBFAF7]"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Category filters */}
              {categories.length > 0 ? (
                <div className="border-b border-[#E7E2D8] bg-white px-5 py-4 sm:px-7">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        activeCategory === 'all'
                          ? 'bg-[#1F6B48] text-white'
                          : 'bg-[#E8F3EC] text-[#1F6B48] hover:bg-[#DDEEE4]'
                      }`}
                    >
                      All
                    </button>

                    {categories.map((category) => (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() =>
                          setActiveCategory(category.key)
                        }
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                          activeCategory === category.key
                            ? 'bg-[#1F6B48] text-white'
                            : 'bg-[#E8F3EC] text-[#1F6B48] hover:bg-[#DDEEE4]'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Gallery images */}
              <div className="p-4 sm:p-6">
                {filteredImages.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredImages.map((image, index) => (
                      <article
                        key={`${image.url}-${image.category}-${index}`}
                        className="group overflow-hidden rounded-2xl border border-[#E7E2D8] bg-white"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImage({
                              url: image.url,
                              category: categoryLabel(
                                image.category,
                              ),
                            })
                          }
                          className="relative block h-64 w-full overflow-hidden text-left"
                        >
                          <Image
                            src={image.url}
                            alt={
                              image.alt ||
                              categoryLabel(image.category)
                            }
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            quality={75}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                          <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                            {categoryLabel(image.category)}
                          </span>

                          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#102033] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                            <Maximize2 size={15} />
                          </span>
                        </button>

                        {buttons.whatsappEnquiry.enabled ? (
                          <div className="flex items-center justify-between gap-3 p-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#102033]">
                                {categoryLabel(
                                  image.category,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-[#536579]">
                                Ask about this space
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(event) =>
                                handleEnquire(image, event)
                              }
                              className="shrink-0 rounded-xl bg-[#FFF1D2] px-3 py-2 text-xs font-bold text-[#102033] transition-colors hover:bg-[#FBE5B6]"
                            >
                              Enquire
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D9D4C9] bg-white px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F3EC] text-[#1F6B48]">
                      <Images size={21} />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-[#102033]">
                      Gallery coming soon
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#536579]">
                      Images for this gallery category will appear
                      here when they are added.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#E7E2D8] bg-white px-5 py-4 sm:px-7">
                <p className="text-xs text-[#536579]">
                  {filteredImages.length}{' '}
                  {filteredImages.length === 1
                    ? 'image'
                    : 'images'}
                </p>

                <button
                  type="button"
                  onClick={handleGalleryClose}
                  className="rounded-xl border border-[#E7E2D8] px-4 py-2 text-xs font-semibold text-[#102033] hover:bg-[#FBFAF7]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============================================================
          EXISTING IMAGE VIEWER
      ============================================================ */}
      <ImageViewerModal
        open={Boolean(selectedImage)}
        imageUrl={selectedImage?.url || ''}
        imageCategory={selectedImage?.category || ''}
        onClose={() => setSelectedImage(null)}
      />

      {/* ============================================================
          EXISTING LEAD CAPTURE → WHATSAPP FLOW
      ============================================================ */}
      <LeadCaptureModal
        open={Boolean(pendingEnquiry)}
        title="Tell us where to respond"
        submitLabel="Continue to WhatsApp"
        defaultName={prefill?.name}
        defaultPhone={prefill?.phone}
        defaultLocation={pendingEnquiry?.category}
        onClose={() => setPendingEnquiry(null)}
        onSubmit={async ({
          name,
          phone: submittedPhone,
          location,
        }) => {
          if (!pendingEnquiry) return;

          const contextMessage =
            `Hi, I'm interested in this ` +
            `${pendingEnquiry.category} hostel option ` +
            `(${pendingEnquiry.image})`;

          const href = resolveActionHref(
            buttons.whatsappEnquiry,
            `https://wa.me/${phone || ''}?text=${encodeURIComponent(
              contextMessage,
            )}`,
            {
              whatsappMessage: contextMessage,
            },
          );

          const response = await capturePublicCtaLead({
            tenantSlug,
            source: 'WhatsApp Enquiry',
            actionType: 'enquiry_click',
            name,
            phone: submittedPhone,
            location: location
              ? `Category: ${location}`
              : `Category: ${pendingEnquiry.category}`,
            pageUrl: globalThis.location.href,
            buttonId: 'gallery-whatsapp-enquiry',
          });

          if (!response.success) {
            throw new Error(
              response.message ||
                'Could not capture lead details',
            );
          }

          setPendingEnquiry(null);

          globalThis.open(
            href,
            '_blank',
            'noopener,noreferrer',
          );
        }}
      />
    </>
  );
}