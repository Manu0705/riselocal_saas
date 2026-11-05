import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenText, FileText, MonitorPlay } from 'lucide-react';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Find Riselocal articles, guides and product resources as they become available.',
};

const resourceTypes = [
  {
    title: 'Articles',
    description:
      'Practical perspectives on business presence, customer relationships and operations.',
    icon: BookOpenText,
  },
  {
    title: 'Guides',
    description: 'Step-by-step material to help you explore common business workflows.',
    icon: FileText,
  },
  {
    title: 'Product resources',
    description: 'Product information and walkthroughs for Riselocal platform capabilities.',
    icon: MonitorPlay,
  },
];

export default function ResourcesPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="RESOURCES"
        title="Ideas and information for your next step."
        description="This is the home for Riselocal articles, guides and product resources. We will publish materials here when they are available."
        image={{
          src: '/images/marketing/resources-illustration.svg',
          alt: 'Illustration of a guide, notes and reading materials',
          caption: 'A home for future Riselocal guides and articles',
        }}
      >
        <Link className="corp-button" href="/book-demo">
          Ask our team <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </CorporatePageHero>

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-grid corp-grid--3">
            {resourceTypes.map((resource) => {
              const Icon = resource.icon;

              return (
                <article className="corp-card" key={resource.title}>
                  <div className="corp-card__icon">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2>{resource.title}</h2>
                  <p>{resource.description}</p>
                  <p className="corp-resource-note">
                    No published {resource.title.toLowerCase()} are available here yet.
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
