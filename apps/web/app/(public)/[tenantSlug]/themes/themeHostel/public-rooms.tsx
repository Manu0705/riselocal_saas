'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react';

import { api } from '@/lib/api-client';

type PublicRoom = {
  sharingType: string;
  capacity: number;
  availability:
    | 'AVAILABLE'
    | 'LIMITED'
    | 'FULL'
    | 'UNAVAILABLE'
    | string;
};

type PublicHostel = {
  name: string;
  rooms: PublicRoom[];
};

type PublicHostelResponse = {
  hostels: PublicHostel[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type Props = {
  tenantSlug: string;
  primaryColor: string;
};

type RoomAvailability =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'FULL'
  | 'UNAVAILABLE'
  | 'COMING_SOON';

type RoomCard = {
  key: string;
  sharingTypes: string[];
  title: string;
  defaultCapacity: number;
  description: string;
  feature: string;
  image: string;
};

const ROOM_CARDS: RoomCard[] = [
  {
    key: 'SINGLE',
    sharingTypes: ['SINGLE', 'SINGLE_SHARING'],
    title: 'Single Sharing',
    defaultCapacity: 1,
    description: 'A private and peaceful space for focused living.',
    feature: 'Personal Space',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80&auto=format&fit=crop',
  },
  {
    key: 'DOUBLE',
    sharingTypes: ['DOUBLE', 'DOUBLE_SHARING'],
    title: 'Double Sharing',
    defaultCapacity: 2,
    description: 'Comfortable and affordable shared rooms.',
    feature: 'Spacious & Airy',
    image:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900&q=80&auto=format&fit=crop',
  },
  {
    key: 'TRIPLE',
    sharingTypes: ['TRIPLE', 'TRIPLE_SHARING'],
    title: 'Triple Sharing',
    defaultCapacity: 3,
    description: 'Budget-friendly option with essential amenities.',
    feature: 'Great for Friends',
    image:
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900&q=80&auto=format&fit=crop',
  },
  {
    key: 'QUAD',
    sharingTypes: ['QUAD', 'FOUR_SHARING', '4_SHARING', 'FOUR'],
    title: '4 Sharing',
    defaultCapacity: 4,
    description: 'Spacious rooms for a vibrant community life.',
    feature: 'Value for Money',
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80&auto=format&fit=crop',
  },
];

function normalizeSharingType(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '_');
}

function formatCapacity(capacity: number) {
  return `${capacity} ${capacity === 1 ? 'Bed' : 'Beds'}`;
}

function getAvailabilityLabel(value: RoomAvailability) {
  switch (value) {
    case 'AVAILABLE':
      return 'Available';

    case 'LIMITED':
      return 'Limited';

    case 'FULL':
      return 'Full';

    case 'UNAVAILABLE':
      return 'Unavailable';

    case 'COMING_SOON':
    default:
      return 'Coming Soon';
  }
}

function getAvailabilityClasses(value: RoomAvailability) {
  switch (value) {
    case 'AVAILABLE':
      return 'border-[#B7E6C8] bg-[#DDF5E5] text-[#166534]';

    case 'LIMITED':
      return 'border-[#E8C98C] bg-[#FFF2D8] text-[#9A6700]';

    case 'FULL':
      return 'border-slate-200 bg-slate-100 text-slate-500';

    case 'UNAVAILABLE':
      return 'border-slate-200 bg-slate-100 text-slate-500';

    case 'COMING_SOON':
    default:
      return 'border-[#E7E2D8] bg-[#F7F4EC] text-[#6B7280]';
  }
}

function getFeatureIconColor(
  availability: RoomAvailability,
  primaryColor: string,
) {
  if (availability === 'FULL' || availability === 'UNAVAILABLE') {
    return '#94A3B8';
  }

  if (availability === 'COMING_SOON') {
    return '#9CA3AF';
  }

  return primaryColor;
}

export default function PublicRooms({
  tenantSlug,
  primaryColor,
}: Readonly<Props>) {
  const [hostels, setHostels] = useState<PublicHostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPublicHostels() {
      try {
        setLoading(true);

        const response = await api.get<ApiResponse<PublicHostelResponse>>(
          `/tenants/slug/${encodeURIComponent(tenantSlug)}/hostel`,
        );

        if (!cancelled) {
          setHostels(
            Array.isArray(response.data?.hostels)
              ? response.data.hostels
              : [],
          );
        }
      } catch (error) {
        /*
         * Room availability is supplementary public information.
         * If the API is unavailable, keep the room UI visible and
         * present availability as Coming Soon instead of blocking
         * the tenant page.
         */
        if (!cancelled) {
          setHostels([]);
        }

        console.error('Failed to load public hostel data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPublicHostels();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const handleEnquire = () => {
    document.getElementById('enquire')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  /*
   * Keep the backend data as the source of truth for availability.
   *
   * Multiple hostels can contain the same sharing type. In that case:
   *
   * AVAILABLE > LIMITED > FULL > UNAVAILABLE
   *
   * This does not expose room numbers, occupancy, student information,
   * or internal hostel IDs.
   */
  const liveAvailability = useMemo(() => {
    const result = new Map<
      string,
      {
        availability: RoomAvailability;
        capacity: number;
      }
    >();

    const priority: Record<RoomAvailability, number> = {
      AVAILABLE: 5,
      LIMITED: 4,
      FULL: 3,
      UNAVAILABLE: 2,
      COMING_SOON: 1,
    };

    for (const hostel of hostels) {
      for (const room of hostel.rooms ?? []) {
        const normalizedType = normalizeSharingType(room.sharingType);

        const availability: RoomAvailability =
          room.availability === 'AVAILABLE'
            ? 'AVAILABLE'
            : room.availability === 'LIMITED'
              ? 'LIMITED'
              : room.availability === 'FULL'
                ? 'FULL'
                : room.availability === 'UNAVAILABLE'
                  ? 'UNAVAILABLE'
                  : 'COMING_SOON';

        const existing = result.get(normalizedType);

        if (!existing) {
          result.set(normalizedType, {
            availability,
            capacity: room.capacity,
          });

          continue;
        }

        if (
          priority[availability] >
          priority[existing.availability]
        ) {
          existing.availability = availability;
        }

        if (room.capacity > 0) {
          existing.capacity = room.capacity;
        }
      }
    }

    return result;
  }, [hostels]);

  const roomCards = useMemo(() => {
    return ROOM_CARDS.map((room) => {
      let availability: RoomAvailability = 'COMING_SOON';
      let capacity = room.defaultCapacity;

      for (const sharingType of room.sharingTypes) {
        const liveRoom = liveAvailability.get(
          normalizeSharingType(sharingType),
        );

        if (!liveRoom) {
          continue;
        }

        availability = liveRoom.availability;

        if (liveRoom.capacity > 0) {
          capacity = liveRoom.capacity;
        }

        /*
         * AVAILABLE is the strongest public availability state,
         * so stop looking once it is found.
         */
        if (availability === 'AVAILABLE') {
          break;
        }
      }

      return {
        ...room,
        availability,
        capacity,
      };
    });
  }, [liveAvailability]);

  return (
    <section
      id="rooms"
      className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"
    >
      {/* ============================================================
          SECTION HEADER
      ============================================================ */}
      <div className="rounded-[2rem] border border-[#E7E2D8] bg-[#FFFDF8] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.28em]"
              style={{ color: primaryColor }}
            >
              Our Rooms
            </p>

            <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-0.03em] text-[#102033] sm:text-4xl">
              Comfort for Every Journey
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#536579]">
              Choose from our well-designed rooms with modern amenities.
            </p>
          </div>

          <button
            type="button"
            onClick={handleEnquire}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:bg-white sm:w-auto"
            style={{
              borderColor: `${primaryColor}88`,
              color: primaryColor,
            }}
          >
            View All Rooms
            <ArrowRight size={16} />
          </button>
        </div>

        {/* ============================================================
            ROOM CARDS
        ============================================================ */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roomCards.map((room) => {
            const availabilityClasses = getAvailabilityClasses(
              room.availability,
            );

            const iconColor = getFeatureIconColor(
              room.availability,
              primaryColor,
            );

            return (
              <article
                key={room.key}
                className="group overflow-hidden rounded-2xl border border-[#E7E2D8] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Room image */}
                <div className="relative h-40 overflow-hidden sm:h-44">
                  <Image
                    src={room.image}
                    alt={`${room.title} hostel room`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                  {/* Availability badge */}
                  <span
                    className={`absolute right-3 top-3 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${availabilityClasses}`}
                  >
                    {loading
                      ? 'Checking...'
                      : getAvailabilityLabel(room.availability)}
                  </span>
                </div>

                {/* Room information */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg font-black text-[#102033]">
                    {room.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-sm text-[#536579]">
                    <Users
                      size={16}
                      style={{ color: primaryColor }}
                    />

                    <span>{formatCapacity(room.capacity)}</span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#536579]">
                    {room.description}
                  </p>

                  {/* Room feature */}
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#536579]">
                    <BedDouble
                      size={17}
                      style={{ color: iconColor }}
                    />

                    <span>{room.feature}</span>
                  </div>

                  {/* Enquiry */}
                  <button
                    type="button"
                    onClick={handleEnquire}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFF1D2] px-4 py-3 text-sm font-bold text-[#102033] transition-colors hover:bg-[#FBE5B6]"
                  >
                    Enquire Now
                    <ArrowRight
                      size={15}
                      style={{ color: primaryColor }}
                    />
                  </button>

                  {/* Backend status hint */}
                  {!loading && room.availability === 'COMING_SOON' ? (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <CheckCircle2 size={13} />
                      Availability coming soon
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          MOBILE / DATA NOTE
      ============================================================ */}
      {!loading && hostels.length === 0 ? (
        <div className="mt-3 flex items-center justify-center gap-2 px-4 text-center text-xs text-[#8A8F98]">
          <Loader2 size={13} />
          Live room availability will appear here when configured.
        </div>
      ) : null}
    </section>
  );
}