import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { CorporatePageHero, CorporatePageLayout } from '../../components/CorporatePageLayout';
import { marketingSolutions } from '../../lib/marketing-solutions';

interface SolutionPageProps {
  params: {
    slug: string;
  };
}

function getSolution(slug: string) {
  return marketingSolutions.find((solution) => solution.slug === slug);
}

export function generateMetadata({ params }: SolutionPageProps): Metadata {
  const solution = getSolution(params.slug);

  return {
    title: solution ? `${solution.title} solution` : 'Solution not found',
    description: solution?.description,
  };
}

export default function SolutionDetailPage({ params }: SolutionPageProps) {
  const solution = getSolution(params.slug);

  if (!solution) {
    notFound();
  }

  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow={solution.category}
        title={`Riselocal for ${solution.title.toLowerCase()}.`}
        description={solution.overview}
        image={{
          src: solution.image,
          alt: solution.imageAlt,
          caption: `An illustration for ${solution.title.toLowerCase()}`,
        }}
      >
        <Link className="corp-button" href="/book-demo">
          Discuss your requirements <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link className="corp-button corp-button--secondary" href="/solutions">
          All solutions
        </Link>
      </CorporatePageHero>

      <section className="corp-section corp-section--white">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">CAPABILITIES</p>
            <h2>Bring important workflows together.</h2>
            <p>
              Explore capabilities available for {solution.title}; exact workflows can be discussed
              with our team.
            </p>
          </div>
          <div className="corp-grid corp-grid--2">
            {solution.features.map((feature) => (
              <article className="corp-card" key={feature}>
                <ul className="corp-list">
                  <li>
                    <CheckCircle2 size={19} aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">WHY A CONNECTED WORKSPACE</p>
            <h2>Make everyday work easier to organise.</h2>
          </div>
          <div className="corp-grid corp-grid--3">
            {solution.benefits.map((benefit, index) => (
              <article className="corp-card" key={benefit}>
                <span className="corp-step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{benefit}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corp-section corp-section--white">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">A TYPICAL WORKFLOW</p>
            <h2>From first interaction to ongoing operations.</h2>
          </div>
          <div className="corp-grid corp-grid--3">
            {solution.workflow.map((step, index) => (
              <article className="corp-card" key={step.title}>
                <span className="corp-step-number">STEP {String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-banner">
            <div>
              <h2>See how Riselocal fits your business.</h2>
              <p>Talk with our team about the workflows and modules relevant to your business.</p>
            </div>
            <Link className="corp-button" href="/book-demo">
              Book a demo <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
