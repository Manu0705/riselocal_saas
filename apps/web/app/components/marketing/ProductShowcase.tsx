'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const showcaseTabs = [
  {
    id: 'overview',
    label: 'Platform overview',
    eyebrow: 'YOUR BUSINESS, CONNECTED',
    title: 'A clearer view of your entire business.',
    description:
      'Bring important business activities together in one organised workspace. Access the information you need and keep everyday work moving.',
    image: '/images/marketing/platform-illustration.svg',
    imageAlt: 'Illustrative view of connected business workflows',
    features: [
      'A central place for business activities',
      'Organised information and workflows',
      'A consistent workspace for your team',
    ],
  },
  {
    id: 'enquiries',
    label: 'Enquiries',
    eyebrow: 'NEVER MISS AN OPPORTUNITY',
    title: 'Keep every customer enquiry organised.',
    description:
      'Manage incoming enquiries, keep track of their progress and organise follow-ups from one place.',
    image: '/images/product/enquiries.svg',
    imageAlt: 'Illustrative view of an organised customer enquiry workspace',
    features: [
      'Centralised enquiry information',
      'Enquiry status tracking',
      'Organised customer follow-ups',
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    eyebrow: 'BUILD BETTER RELATIONSHIPS',
    title: 'Keep customer information within reach.',
    description:
      'Maintain customer details and interaction history in an organised workspace that helps your team stay informed.',
    image: '/images/product/customers.svg',
    imageAlt: 'Illustrative view of customer information and activity',
    features: [
      'Centralised customer records',
      'Accessible contact information',
      'Better organised customer interactions',
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    eyebrow: 'SIMPLIFY DAILY WORK',
    title: 'Bring everyday operations together.',
    description:
      'Use industry-specific tools to organise routine activities and manage your business processes more efficiently.',
    image: '/images/product/operations.svg',
    imageAlt: 'Illustrative view of a coordinated business workflow',
    features: [
      'Industry-specific workflows',
      'Organised daily activities',
      'Connected business processes',
    ],
  },
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(showcaseTabs[0]);
  const [imageFailed, setImageFailed] = useState(false);

  const handleTabChange = (tab: (typeof showcaseTabs)[number]) => {
    setActiveTab(tab);
    setImageFailed(false);
  };

  return (
    <section className="marketing-showcase" id="product">
      <div className="marketing-container">
        <div className="marketing-showcase-heading">
          <span className="marketing-section-eyebrow">EXPLORE THE PLATFORM</span>

          <h2>
            Everything you need.
            <span> Connected in one place.</span>
          </h2>

          <p>
            Explore how Riselocal helps you manage your online presence, customer relationships and
            everyday business activities.
          </p>
        </div>

        <div
          className="marketing-showcase-tabs"
          role="tablist"
          aria-label="Explore Riselocal features"
        >
          {showcaseTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`showcase-tab-${tab.id}`}
              aria-selected={activeTab.id === tab.id}
              aria-controls={`showcase-panel-${tab.id}`}
              className={`marketing-showcase-tab ${activeTab.id === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="marketing-showcase-content"
          role="tabpanel"
          id={`showcase-panel-${activeTab.id}`}
          aria-labelledby={`showcase-tab-${activeTab.id}`}
        >
          <div className="marketing-showcase-info">
            <span className="marketing-showcase-eyebrow">{activeTab.eyebrow}</span>

            <h3>{activeTab.title}</h3>

            <p className="marketing-showcase-description">{activeTab.description}</p>

            <ul className="marketing-showcase-features">
              {activeTab.features.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 size={18} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/book-demo" className="marketing-showcase-link">
              See Riselocal in action
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="marketing-showcase-visual">
            <div className="marketing-showcase-image">
              {!imageFailed ? (
                <Image
                  key={activeTab.image}
                  src={activeTab.image}
                  alt={activeTab.imageAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                  className="marketing-showcase-screenshot"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="marketing-showcase-image-placeholder">
                  <div className="marketing-showcase-placeholder-icon">
                    <CheckCircle2 size={26} />
                  </div>
                  <h4>Product screenshot coming soon</h4>
                  <p>
                    Add the actual Riselocal product screenshot for this tab to display it here.
                  </p>
                  <span>{activeTab.image}</span>
                </div>
              )}
            </div>
            <p className="marketing-showcase-image-caption">
              Illustrative capability preview, not a product screenshot
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
