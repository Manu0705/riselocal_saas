import Image from "next/image";
import { BadgeCheck, Scissors, Sparkles } from "lucide-react";
import type { ResolvedTenant } from "@/lib/tenant-resolver";
import Services from "../../components/services";
import Gallery from "../../components/gallery";
import QuickActions from "../../components/quick-actions";
import Booking from "../../components/booking";
import Contact from "../../components/contact";
import HowItWorks from "../../components/how-it-works";

type Props = {
  tenant: ResolvedTenant;
  tenantSlug: string;
};

export default function ThemeMinimal({ tenant, tenantSlug }: Readonly<Props>) {
  return (
    <div className="min-h-screen bg-white py-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">

        {/* 🔥 HEADER */}
        <div className="p-5 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-md" />

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {tenant.name} <span className="text-gray-500">- Location</span>
                </h2>
                <p className="text-sm text-gray-500">★★★★★ (1.2K Reviews)</p>
              </div>
            </div>

            <span className="text-xs bg-gray-200 px-3 py-1 rounded">
              OPEN NOW
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 mt-4">
            <button className="flex-1 bg-gray-700 text-white py-2 rounded">
              Book Appointment
            </button>

            <QuickActions
              phone={tenant.whatsapp || tenant.phone}
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              actionButtons={tenant.actionButtons}
            />

            <button className="flex-1 bg-gray-700 text-white py-2 rounded">
              Call
            </button>
          </div>
        </div>

        {/* 🔥 AVAILABILITY */}
        <div className="p-5 border-b">
          <h3 className="font-semibold text-gray-700 mb-3">
            Real-Time Availability
          </h3>

          <div className="flex text-sm border rounded overflow-hidden">
            <div className="flex-1 text-center py-2 border-r">
              2:00 PM <span className="text-gray-500">BUSY</span>
            </div>

            <div className="flex-1 text-center py-2 border-r">
              3:00 PM <span className="text-gray-500">BUSY</span>
            </div>

            <div className="flex-1 text-center py-2 bg-green-100 border-r">
              <span className="font-semibold">4:00 PM</span> AVAILABLE
            </div>

            <div className="flex-1 text-center py-2">
              5:00 PM AVAILABLE
            </div>
          </div>
        </div>

        {/* 🔥 QUICK BOOKING */}
        <div className="p-5 grid md:grid-cols-2 gap-4 border-b">

          {/* LEFT */}
          <div className="space-y-3">
            <select className="w-full border p-2 rounded">
              <option>Select Service</option>
            </select>

            <select className="w-full border p-2 rounded">
              <option>Select Time Slot</option>
            </select>

            <input
              placeholder="Your Name"
              className="w-full border p-2 rounded"
            />

            <input
              placeholder="Phone Number"
              className="w-full border p-2 rounded"
            />

            <button className="w-full bg-gray-700 text-white py-2 rounded">
              CONFIRM BOOKING
            </button>
          </div>

          {/* RIGHT */}
          <div className="border rounded p-3">
            <p className="font-semibold mb-2">Chat to Book</p>

            <textarea
              defaultValue="Hi, I'd like to book for 5 PM. Is it available?"
              className="w-full border p-2 rounded mb-3"
            />

            <button className="bg-gray-700 text-white px-4 py-2 rounded">
              SEND
            </button>
          </div>
        </div>

        {/* 🔥 SERVICES + GALLERY */}
        <div className="p-5 grid md:grid-cols-2 gap-4 border-b">

          <div>
            <h3 className="font-semibold mb-3">Our Services</h3>
            <Services services={tenant.services || []} />
          </div>

          <div>
            <h3 className="font-semibold mb-3">Before / After Photos</h3>
            <Gallery
              images={tenant.gallery || []}
              galleryCategories={tenant.galleryCategories || []}
              tenantSlug={tenantSlug}
              tenantId={tenant.id}
              phone={tenant.whatsapp || tenant.phone}
              actionButtons={tenant.actionButtons}
            />
          </div>

        </div>

        {/* 🔥 BOOKING + CONTACT */}
        <div className="p-5 grid md:grid-cols-2 gap-4 border-b">

          <Booking
            tenantId={tenant.id}
            tenantSlug={tenantSlug}
            title="Reserve your appointment"
            subtitle="Share your preferred service and time."
            submitLabel="Reserve Slot"
          />

          <Contact
            tenant={tenant}
            tenantId={tenant.id}
            tenantSlug={tenantSlug}
            actionButtons={tenant.actionButtons}
          />

        </div>

        {/* 🔥 HOW IT WORKS */}
        <div className="p-5 border-b">
          <HowItWorks
            title="How booking works"
            steps={[
              { title: "Browse services", desc: "Explore offerings" },
              { title: "Check availability", desc: "Find open slots" },
              { title: "Book instantly", desc: "Confirm your slot" },
            ]}
          />
        </div>

        {/* 🔥 FOOTER */}
        <div className="grid grid-cols-3 text-center text-sm">
          <div className="p-3 border-r">Customer Reviews</div>
          <div className="p-3 border-r">Map / Location</div>
          <div className="p-3">Opening Hours</div>
        </div>

      </div>
    </div>
  );
}