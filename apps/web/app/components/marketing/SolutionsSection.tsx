import Link from 'next/link';
import SolutionCard from './SolutionCard';

const solutions = [
  {
    title: 'Hostels & PGs',
    category: 'Accommodation',
    description:
      'Manage enquiries, admissions, rooms, student records and payments through one connected workspace.',
    image: '/images/solutions/hostels-pg.svg',
    imageAlt: 'Illustration of hostel rooms and resident management',
    href: '/solutions/hostels-pg',
  },
  {
    title: 'Dining',
    category: 'Food & Hospitality',
    description:
      'Bring your online presence, customer enquiries and everyday business activities together.',
    image: '/images/solutions/dining.svg',
    imageAlt: 'Illustration of a dining menu and plated meal',
    href: '/solutions/dining',
  },
  {
    title: 'Professionals',
    category: 'Professional Services',
    description:
      'Build your digital presence, organise customer relationships and manage your service workflow.',
    image: '/images/solutions/professionals.svg',
    imageAlt: 'Illustration of a professional service workspace',
    href: '/solutions/professionals',
  },
  {
    title: 'Agencies',
    category: 'Business Services',
    description:
      'Keep client enquiries, relationships, projects and business operations organised in one place.',
    image: '/images/solutions/agencies.svg',
    imageAlt: 'Illustration of a team coordinating client work',
    href: '/solutions/agencies',
  },
];

export default function SolutionsSection() {
  return (
    <section className="marketing-solutions" id="solutions">
      <div className="marketing-container">
        <div className="marketing-section-heading">
          <span className="marketing-section-eyebrow">SOLUTIONS FOR YOUR INDUSTRY</span>

          <h2>
            Built for the way <span>your business works.</span>
          </h2>

          <p>
            Different businesses have different needs. Riselocal brings purpose-built tools together
            in one connected platform.
          </p>
        </div>

        <div className="marketing-solutions-grid">
          {solutions.map((solution) => (
            <SolutionCard key={solution.title} {...solution} />
          ))}
        </div>

        <div className="marketing-solutions-bottom">
          <p>One platform. Different solutions. A more organised way to grow.</p>

          <Link href="/platform" className="marketing-solutions-platform-link">
            Discover the platform
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
