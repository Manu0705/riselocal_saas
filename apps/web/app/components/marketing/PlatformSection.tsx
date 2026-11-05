
import Link from 'next/link';
import {
  Globe2,
  Users,
  Workflow,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

const capabilities = [
  {
    number: '01',
    title: 'Online Presence',
    description:
      'Build a professional digital presence that helps customers discover your business and understand what you offer.',
    features: [
      'Professional business website',
      'Services and offerings showcase',
      'Business information in one place',
    ],
    icon: Globe2,
    className: 'presence',
  },
  {
    number: '02',
    title: 'Customer Management',
    description:
      'Keep customer enquiries, contact details and follow-ups organised so you can manage every relationship more effectively.',
    features: [
      'Centralised customer information',
      'Enquiry tracking',
      'Follow-up management',
    ],
    icon: Users,
    className: 'customers',
  },
  {
    number: '03',
    title: 'Business Operations',
    description:
      'Bring your everyday business activities into a connected workspace and make routine work easier to organise.',
    features: [
      'Organised business workflows',
      'Industry-specific tools',
      'Connected operational activities',
    ],
    icon: Workflow,
    className: 'operations',
  },
];

export default function PlatformSection() {
  return (
    <section className="marketing-platform" id="platform">
      <div className="marketing-container">
        <div className="marketing-platform-heading">
          <span className="marketing-section-eyebrow">
            ONE CONNECTED PLATFORM
          </span>

          <h2>
            Everything works better
            <span> when it works together.</span>
          </h2>

          <p>
            Riselocal connects your online presence, customer relationships
            and daily business operations in one platform.
          </p>
        </div>

        <div className="marketing-platform-grid">
          {capabilities.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className={`marketing-capability-card ${item.className}`}
                key={item.number}
              >
                <div className="marketing-capability-top">
                  <div className="marketing-capability-icon">
                    <Icon size={25} strokeWidth={1.8} />
                  </div>

                  <span className="marketing-capability-number">
                    {item.number}
                  </span>
                </div>

                <h3>{item.title}</h3>

                <p className="marketing-capability-description">
                  {item.description}
                </p>

                <ul className="marketing-capability-features">
                  {item.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="marketing-capability-bottom">
                  <span>Part of one connected platform</span>
                  <ArrowUpRight size={17} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="marketing-platform-cta">
          <div>
            <h3>One platform for your entire business.</h3>
            <p>
              Explore how Riselocal brings different business needs together.
            </p>
          </div>

          <Link href="/solutions" className="marketing-platform-button">
            Explore solutions
          </Link>
        </div>
      </div>
    </section>
  );
}
