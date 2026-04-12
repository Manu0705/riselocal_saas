"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { ResolvedTenant } from "@/lib/tenant-resolver";
import { capturePublicCtaLead } from "@/lib/public-lead-capture";

const DEFAULT_OPEN_HOUR = 9;
const DEFAULT_CLOSE_HOUR = 21;

const DEFAULT_SERVICES = [
  "Haircut",
  "Hair Coloring",
  "Hair Spa",
  "Beard Trim",
  "Facial",
  "Detan",
  "Head Massage",
  "Waxing",
];

function normalizeHour(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

function parseAvailableHours(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "number" && Number.isInteger(item)) {
          return item;
        }
        if (typeof item === "string") {
          const parsed = Number.parseInt(item, 10);
          return Number.isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
      })
      .filter((hour): hour is number => typeof hour === "number");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number.parseInt(item.trim(), 10))
      .filter((hour) => !Number.isNaN(hour));
  }

  return undefined;
}

function formatHourLabel(hour: number) {
  const normalized = hour % 24;
  const label = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${label}:00 ${normalized >= 12 ? "PM" : "AM"}`;
}

function resolveServiceOptions(tenant: ResolvedTenant): readonly string[] {
  const normalized = Array.isArray(tenant.services)
    ? tenant.services
        .map((service) => (typeof service?.name === "string" ? service.name.trim() : ""))
        .filter((name) => name.length > 0)
    : [];

  return normalized.length > 0 ? normalized : DEFAULT_SERVICES;
}

function getTimeSlots(openHour: number, closeHour: number, availableHours?: number[]) {
  const start = Math.max(DEFAULT_OPEN_HOUR, Math.min(openHour, DEFAULT_CLOSE_HOUR));
  const end = Math.max(start, Math.min(closeHour, DEFAULT_CLOSE_HOUR));
  const length = end - start + 1;

  return Array.from({ length }, (_, i) => {
    const hour = start + i;
    const isAvailable = Array.isArray(availableHours)
      ? availableHours.includes(hour)
      : hour % 2 === 0;

    return {
      hour,
      label: formatHourLabel(hour),
      isAvailable,
    };
  });
}

function MultiSelectServices({
  value,
  onChange,
  options,
}: {
  value: readonly string[];
  onChange: (value: string[]) => void;
  options: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleService = (service: string) => {
    if (value.includes(service)) {
      onChange(value.filter((s) => s !== service));
    } else {
      onChange([...value, service]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-full rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-3 pr-12 text-sm text-slate-700 flex justify-between items-center transition duration-300 hover:border-rose-200"
      >
        <div className="flex flex-wrap gap-1">
          {value.length === 0 ? (
            <span className="text-gray-400">Select Services</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700"
              >
                <span>{v}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleService(v);
                  }}
                  className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 transition hover:bg-slate-400"
                  aria-label={`Remove ${v}`}
                >
                  <X size={12} />
                </span>
              </span>
            ))
          )}
        </div>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100">
          <ChevronDown size={16} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-md p-2">
          {options.filter((service) => !value.includes(service)).length === 0 ? (
            <div className="p-2 text-sm text-slate-400">All selected services are already added.</div>
          ) : (
            options
              .filter((service) => !value.includes(service))
              .map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className="w-full text-left flex justify-between p-1 text-sm hover:bg-gray-100"
                >
                  <span>{service}</span>
                  {value.includes(service) && <Check size={14} />}
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingForm({
  tenant,
  tenantSlug,
}: {
  tenant: ResolvedTenant;
  tenantSlug: string;
}) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const openHour = normalizeHour(tenant.openHour, DEFAULT_OPEN_HOUR);
  const closeHour = normalizeHour(tenant.closeHour, DEFAULT_CLOSE_HOUR);
  const availableHours = parseAvailableHours(tenant.availableHours);
  const timeSlots = getTimeSlots(openHour, closeHour, availableHours);
  const availableSlots = timeSlots.filter((slot) => slot.isAvailable);
  const options = resolveServiceOptions(tenant);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBooking = async () => {
    if (!name || !phone || selectedServices.length === 0 || !time) {
      alert("Please select your name, phone, service, and preferred time.");
      return;
    }

    setOpenDropdown(false);

    try {
      setLoading(true);

      const result = await capturePublicCtaLead({
        tenantSlug,
        source: "BOOKING",
        actionType: "booking",
        name,
        phone,
        notes: `Requested time: ${time}`,
        selectedServices,
        selectedTime: time,
      });

      if (result.success) {
        alert("Booking submitted successfully 🎉");
        setSelectedServices([]);
        setName("");
        setPhone("");
        setTime("");
      } else {
        alert(result.message || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="booking-form" className="rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_26px_80px_rgba(243,161,140,0.16)] backdrop-blur-xl transition-all duration-300">
      <div className="mb-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.32em] text-rose-600">Book a service</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reserve your luxury appointment</h2>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Choose your services, select a time slot, and send your contact details for a smooth booking experience.
        </p>
      </div>

      <div className="grid gap-4">
        <MultiSelectServices value={selectedServices} onChange={setSelectedServices} options={options} />

        <div ref={dropdownRef} className="relative w-full">
          <input
            readOnly
            value={time}
            onClick={() => setOpenDropdown(true)}
            onFocus={() => setOpenDropdown(true)}
            placeholder="Select available time"
            className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-3 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />

          <button
            type="button"
            onClick={() => setOpenDropdown((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            aria-label="Toggle booking time options"
          >
            <ChevronDown size={18} />
          </button>

          {openDropdown && (
            <div className="absolute z-10 mt-3 w-full rounded-[1.5rem] border border-slate-200 bg-white shadow-xl max-h-64 overflow-y-auto p-3">
              {availableSlots.length === 0 ? (
                <div className="p-2 text-sm text-slate-400">No slots available</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.hour}
                      type="button"
                      onClick={() => {
                        setTime(slot.label);
                        setOpenDropdown(false);
                      }}
                      className={`rounded-2xl px-3 py-2 text-sm font-semibold transition duration-300 ${
                        slot.label === time
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />

        <button
          type="button"
          onClick={handleBooking}
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
