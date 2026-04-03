'use client';

import Link from 'next/link';

const featureCards = [
  {
    title: 'Multi-Tenant Website Engine',
    body: 'Launch branded tenant sites with configurable sections, themes, and service catalogs from one secure platform.',
  },
  {
    title: 'Lead Capture and Routing',
    body: 'Collect leads from forms, campaigns, and landing pages, then route them instantly to the right team members.',
  },
  {
    title: 'Ops Dashboard and Insights',
    body: 'Track pipeline velocity, conversion trends, and daily performance through clean dashboards and actionable analytics.',
  },
  {
    title: 'Automation and Follow-ups',
    body: 'Reduce manual work using automated reminders, status updates, and task queues for faster customer response.',
  },
  {
    title: 'Custom Branding at Scale',
    body: 'Apply logos, colors, messaging, and localized content per tenant while keeping operations centralized.',
  },
  {
    title: 'Secure API-Driven Stack',
    body: 'Power your growth with resilient APIs, role-based access controls, and a scalable architecture built for SaaS workloads.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Onboard',
    body: 'Create tenant workspaces, configure brand identity, and publish customer-facing pages quickly.',
  },
  {
    step: '02',
    title: 'Capture',
    body: 'Bring leads in from digital channels and turn every inquiry into a trackable opportunity.',
  },
  {
    step: '03',
    title: 'Engage',
    body: 'Use guided workflows to follow up, qualify, and progress leads across teams without losing context.',
  },
  {
    step: '04',
    title: 'Scale',
    body: 'Analyze outcomes, optimize conversion paths, and expand to more tenants with consistent quality.',
  },
];

export default function AboutUsPage() {
  return (
    <main className="about-shell">
      <section className="about-hero">
        <p className="kicker">About RiseLocal</p>
        <h1>We build the complete operating system for modern local-service SaaS.</h1>
        <p className="lead">
          RiseLocal helps businesses and operators run everything end to end, from branded tenant websites and lead generation
          to follow-ups, analytics, and scalable growth workflows.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="btn-primary">
            Get Started
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>

      <section className="feature-grid" aria-label="RiseLocal capabilities">
        {featureCards.map((card) => (
          <article key={card.title} className="feature-card">
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <section className="process" aria-label="How RiseLocal works">
        <div className="section-heading">
          <p className="kicker">How It Works</p>
          <h2>From setup to scale in one connected flow</h2>
        </div>
        <div className="process-grid">
          {processSteps.map((item) => (
            <article key={item.step} className="process-card">
              <p className="step-pill">Step {item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-panel">
        <h2>Built for teams that want speed, clarity, and scale.</h2>
        <p>
          Whether you are launching your first tenant or managing hundreds, RiseLocal gives you one platform to deliver
          better customer experiences and measurable business growth.
        </p>
        <Link href="/login" className="btn-primary">
          Start With RiseLocal
        </Link>
      </section>

      <style jsx>{`
        .about-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(190, 242, 100, 0.26) 0%, rgba(190, 242, 100, 0) 35%),
            radial-gradient(circle at 90% 20%, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 38%),
            linear-gradient(180deg, #f8fafc 0%, #eef6ff 48%, #f3f7f2 100%);
          color: #111827;
          padding: 2.2rem 1.2rem 3.5rem;
          font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
        }

        .about-hero,
        .feature-grid,
        .process,
        .cta-panel {
          width: min(1100px, 100%);
          margin: 0 auto;
        }

        .about-hero {
          text-align: center;
          padding: clamp(1rem, 1.5vw, 1.8rem) 0 2.2rem;
          animation: riseIn 500ms ease-out both;
        }

        .kicker {
          margin: 0 0 0.9rem;
          text-transform: uppercase;
          font-size: 0.76rem;
          letter-spacing: 0.18em;
          color: #166534;
          font-weight: 700;
        }

        h1 {
          margin: 0;
          font-size: clamp(2rem, 4.8vw, 3.5rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #0f172a;
          text-wrap: balance;
        }

        .lead {
          margin: 1.2rem auto 0;
          width: min(760px, 100%);
          font-size: clamp(1rem, 2vw, 1.22rem);
          line-height: 1.7;
          color: #334155;
        }

        .hero-actions {
          margin-top: 1.8rem;
          display: flex;
          justify-content: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border-radius: 999px;
          padding: 0.8rem 1.35rem;
          text-decoration: none;
          font-weight: 700;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0f766e, #0369a1);
          color: #f8fafc;
          box-shadow: 0 12px 24px rgba(3, 105, 161, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(15, 118, 110, 0.33);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.84);
          color: #0f172a;
          border: 1px solid rgba(15, 23, 42, 0.15);
        }

        .btn-secondary:hover {
          transform: translateY(-1px);
          background: #ffffff;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.95rem;
          margin-top: 1.4rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(148, 163, 184, 0.34);
          border-radius: 18px;
          padding: 1.1rem;
          backdrop-filter: blur(6px);
          animation: riseIn 600ms ease both;
        }

        .feature-card h2 {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.35;
          color: #0f172a;
        }

        .feature-card p {
          margin: 0.65rem 0 0;
          color: #334155;
          line-height: 1.6;
          font-size: 0.96rem;
        }

        .process {
          margin-top: 2.2rem;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 1rem;
        }

        .section-heading h2 {
          margin: 0;
          font-size: clamp(1.55rem, 3.4vw, 2.35rem);
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.95rem;
        }

        .process-card {
          background: linear-gradient(165deg, rgba(15, 23, 42, 0.96), rgba(15, 118, 110, 0.84));
          color: #ecfeff;
          border-radius: 18px;
          padding: 1rem;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.22);
        }

        .step-pill {
          margin: 0;
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          background: rgba(226, 232, 240, 0.24);
          color: #d1fae5;
        }

        .process-card h3 {
          margin: 0.75rem 0 0.35rem;
          font-size: 1.1rem;
        }

        .process-card p {
          margin: 0;
          line-height: 1.55;
          color: rgba(236, 254, 255, 0.9);
        }

        .cta-panel {
          margin-top: 2.3rem;
          text-align: center;
          border-radius: 22px;
          padding: 1.5rem;
          background: linear-gradient(130deg, #14532d, #166534, #0f766e);
          color: #f0fdf4;
          box-shadow: 0 14px 30px rgba(20, 83, 45, 0.28);
        }

        .cta-panel h2 {
          margin: 0;
          font-size: clamp(1.35rem, 3.4vw, 2rem);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .cta-panel p {
          margin: 0.8rem auto 1rem;
          width: min(800px, 100%);
          line-height: 1.7;
          color: rgba(240, 253, 244, 0.94);
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .process-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .about-shell {
            padding: 1.3rem 0.9rem 2.6rem;
          }

          .feature-grid,
          .process-grid {
            grid-template-columns: 1fr;
          }

          .feature-card,
          .process-card,
          .cta-panel {
            border-radius: 16px;
          }

          .hero-actions {
            align-items: stretch;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
