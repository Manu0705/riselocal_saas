import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, Briefcase, Utensils, UsersRound } from 'lucide-react';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';
import { marketingSolutions } from '../lib/marketing-solutions';

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'Explore Riselocal solutions for hostels and PGs, dining businesses, professionals and agencies.',
};

const solutionIcons = [Building2, Utensils, UsersRound, Briefcase];

export default function SolutionsPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="INDUSTRY SOLUTIONS"
        title="A connected platform, shaped around different businesses."
        description="Start with the capabilities shared across Riselocal, then explore workflows designed for the needs of your industry."
        image={{
          src: '/images/marketing/platform-illustration.svg',
          alt: 'Illustration of business tools connected in one platform',
          caption: 'One platform, with workflows for different businesses',
        }}
      />

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">FIND YOUR SOLUTION</p>
            <h2>Tools for the way your business works.</h2>
            <p>Choose an industry to see its capabilities, benefits and example workflow.</p>
          </div>
          <div className="corp-grid corp-grid--2">
            {marketingSolutions.map((solution, index) => {
              const Icon = solutionIcons[index];

              return (
                <article className="corp-card corp-card--solution" key={solution.slug}>
                  <figure className="corp-solution-card__visual">
                    <Image
                      src={solution.image}
                      alt={solution.imageAlt}
                      fill
                      sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 560px"
                    />
                  </figure>
                  <div className="corp-solution-card__content">
                    <div className="corp-card__icon">
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <p className="corp-eyebrow">{solution.category}</p>
                    <h3>{solution.title}</h3>
                    <p>{solution.description}</p>
                    <Link className="corp-card-link" href={`/solutions/${solution.slug}`}>
                      Explore {solution.title} <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
