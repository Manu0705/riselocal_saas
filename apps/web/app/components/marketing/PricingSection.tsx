
import Link from 'next/link';
import {
  Check,
  Globe2,
  Users,
  Workflow,
  Building2,
  Utensils,
  Briefcase,
  Layers3,
  ArrowRight,
  Plus,
} from 'lucide-react';

const coreFeatures = [
  {
    icon: Globe2,
    title: 'Online presence',
    description: 'Establish your business presence online.',
  },
  {
    icon: Users,
    title: 'Customer management',
    description: 'Organise enquiries and customer information.',
  },
  {
    icon: Workflow,
    title: 'Business operations',
    description: 'Manage everyday business activities.',
  },
];

const industryModules = [
  {
    icon: Building2,
    title: 'Hostels & PGs',
    description: 'Tools designed for accommodation management.',
  },
  {
    icon: Utensils,
    title: 'Dining',
    description: 'Capabilities designed for food businesses.',
  },
  {
    icon: Briefcase,
    title: 'Professionals',
    description: 'Tools for professional service businesses.',
  },
  {
    icon: Layers3,
    title: 'Agencies',
    description: 'Capabilities for agencies and business services.',
  },
];

export default function PricingSection() {
  return (
    <section className="marketing-pricing" id="pricing">
      <div className="marketing-container">
        <div className="marketing-pricing-heading">
          <span className="marketing-section-eyebrow">
            SIMPLE, FLEXIBLE PRICING
          </span>

          <h2>
            One platform.
            <span> Flexible for your business.</span>
          </h2>

          <p>
            Start with the Riselocal platform and choose the
            industry-specific modules that match your business needs.
          </p>
        </div>

        <div className="marketing-pricing-layout">
          {/* Main subscription card */}
          <article className="marketing-pricing-card">
            <div className="marketing-pricing-card-header">
              <div className="marketing-pricing-icon">
                <Layers3 size={25} />
              </div>

              <span className="marketing-pricing-label">
                ONE CONNECTED PLATFORM
              </span>
            </div>

            <h3>Riselocal Platform</h3>

            <p className="marketing-pricing-intro">
              A common platform to manage your online presence,
              customer relationships and business operations.
            </p>

            <div className="marketing-pricing-divider" />

            <h4>Core platform capabilities</h4>

            <ul className="marketing-pricing-features">
              {coreFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <li key={feature.title}>
                    <div className="marketing-pricing-feature-icon">
                      <Icon size={18} />
                    </div>

                    <div>
                      <strong>{feature.title}</strong>
                      <span>{feature.description}</span>
                    </div>

                    <Check
                      className="marketing-pricing-check"
                      size={19}
                    />
                  </li>
                );
              })}
            </ul>

            <div className="marketing-pricing-note">
              <Check size={17} />
              <span>
                One common subscription for the Riselocal platform.
              </span>
            </div>

            <Link
              href="/book-demo"
              className="marketing-pricing-primary-button"
            >
              Discuss your requirements
              <ArrowRight size={18} />
            </Link>

            <p className="marketing-pricing-footnote">
              Contact our team for subscription and pricing details.
            </p>
          </article>

          {/* Optional industry modules */}
          <aside className="marketing-modules-card">
            <div className="marketing-modules-header">
              <span className="marketing-modules-eyebrow">
                EXTEND YOUR PLATFORM
              </span>

              <h3>
                Add the modules
                <span> your business needs.</span>
              </h3>

              <p>
                Choose industry-specific modules to support the way
                your business operates.
              </p>
            </div>

            <div className="marketing-modules-list">
              {industryModules.map((module) => {
                const Icon = module.icon;

                return (
                  <div
                    className="marketing-module-item"
                    key={module.title}
                  >
                    <div className="marketing-module-icon">
                      <Icon size={21} />
                    </div>

                    <div className="marketing-module-content">
                      <h4>{module.title}</h4>
                      <p>{module.description}</p>
                    </div>

                    <Plus
                      size={18}
                      className="marketing-module-plus"
                    />
                  </div>
                );
              })}
            </div>

            <div className="marketing-modules-footer">
              <div className="marketing-modules-footer-icon">
                <Check size={17} />
              </div>

              <p>
                Choose the modules that fit your business requirements.
              </p>
            </div>
          </aside>
        </div>

        <div className="marketing-pricing-bottom">
          <p>
            Not sure which modules are right for your business?
          </p>

          <Link href="/book-demo">
            Talk to our team
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
