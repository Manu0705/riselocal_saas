
import Link from 'next/link';
import {
  LayoutDashboard,
  Clock3,
  Users,
  Workflow,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

const businessBenefits = [
  {
    number: '01',
    icon: LayoutDashboard,
    title: 'One connected workspace',
    description:
      'Bring your online presence, customer information and business activities together instead of managing them across disconnected tools.',
    points: [
      'Centralised business information',
      'Connected business activities',
    ],
  },
  {
    number: '02',
    icon: Clock3,
    title: 'More organised daily work',
    description:
      'Keep routine activities structured and make important business information easier for your team to access.',
    points: [
      'Organised workflows',
      'Clearer day-to-day processes',
    ],
  },
  {
    number: '03',
    icon: Users,
    title: 'Better customer management',
    description:
      'Keep enquiries, customer details and follow-ups organised so your team can manage customer relationships more effectively.',
    points: [
      'Organised customer records',
      'Enquiry and follow-up tracking',
    ],
  },
  {
    number: '04',
    icon: Workflow,
    title: 'Tools that fit your business',
    description:
      'Use industry-specific capabilities designed around the way different types of businesses operate.',
    points: [
      'Industry-focused functionality',
      'A platform that supports different business needs',
    ],
  },
];

export default function BusinessValueSection() {
  return (
    <section className="marketing-value" id="business-value">
      <div className="marketing-container">
        <div className="marketing-value-heading">
          <span className="marketing-section-eyebrow">
            WHY RISELOCAL
          </span>

          <h2>
            Less scattered work.
            <span> More connected business.</span>
          </h2>

          <p>
            Running a business involves managing customers, information
            and everyday activities. Riselocal brings these needs together
            in one organised platform.
          </p>
        </div>

        <div className="marketing-value-grid">
          {businessBenefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                className="marketing-value-card"
                key={benefit.number}
              >
                <div className="marketing-value-card-top">
                  <div className="marketing-value-icon">
                    <Icon size={25} strokeWidth={1.8} />
                  </div>

                  <span className="marketing-value-number">
                    {benefit.number}
                  </span>
                </div>

                <h3>{benefit.title}</h3>

                <p className="marketing-value-description">
                  {benefit.description}
                </p>

                <ul className="marketing-value-points">
                  {benefit.points.map((point) => (
                    <li key={point}>
                      <CheckCircle2 size={16} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="marketing-value-bottom">
          <div className="marketing-value-bottom-content">
            <span className="marketing-value-bottom-label">
              BUILT AROUND YOUR BUSINESS
            </span>

            <h3>
              Your business has different needs.
              <span> Your platform should bring them together.</span>
            </h3>

            <p>
              Discover how Riselocal connects business tools and
              industry-specific workflows in one place.
            </p>

            <Link
              href="/book-demo"
              className="marketing-value-button"
            >
              Explore Riselocal
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="marketing-value-decoration" aria-hidden="true">
            <div className="marketing-value-decoration-circle circle-one" />
            <div className="marketing-value-decoration-circle circle-two" />
            <div className="marketing-value-decoration-circle circle-three" />
            <div className="marketing-value-decoration-center">
              <LayoutDashboard size={34} />
              <span>RISELOCAL</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
