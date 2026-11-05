
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const demoHighlights = [
  'Explore the platform and its capabilities',
  'Understand the modules for your business',
  'Discuss your business requirements with our team',
];

export default function DemoCTA() {
  return (
    <section className="marketing-demo" id="book-demo">
      <div className="marketing-container">
        <div className="marketing-demo-card">
          <div className="marketing-demo-content">
            <div className="marketing-demo-eyebrow">
              <Sparkles size={15} />
              <span>LET'S BUILD SOMETHING BETTER</span>
            </div>

            <h2>
              Ready to bring your
              <span> business together?</span>
            </h2>

            <p className="marketing-demo-description">
              Discover how Riselocal can help you manage your online
              presence, customer relationships and everyday operations
              through one connected platform.
            </p>

            <ul className="marketing-demo-highlights">
              {demoHighlights.map((highlight) => (
                <li key={highlight}>
                  <CheckCircle2 size={18} />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            <div className="marketing-demo-actions">
              <Link
                href="/book-demo"
                className="marketing-demo-primary-button"
              >
                <CalendarDays size={18} />
                Request a Demo
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/contact"
                className="marketing-demo-secondary-button"
              >
                <MessageCircle size={18} />
                Contact Our Team
              </Link>
            </div>

            <p className="marketing-demo-note">
              Our team will get in touch to understand your requirements.
            </p>
          </div>

          <div className="marketing-demo-visual" aria-hidden="true">
            <div className="marketing-demo-orbit orbit-one" />
            <div className="marketing-demo-orbit orbit-two" />
            <div className="marketing-demo-orbit orbit-three" />

            <div className="marketing-demo-visual-card">
              <div className="marketing-demo-visual-icon">
                <Sparkles size={30} />
              </div>

              <span className="marketing-demo-visual-brand">
                RISELOCAL
              </span>

              <h3>
                One platform.
                <span> Connected business.</span>
              </h3>

              <div className="marketing-demo-visual-divider" />

              <div className="marketing-demo-visual-status">
                <span />
                <p>Built around your business needs</p>
              </div>
            </div>

            <div className="marketing-demo-floating floating-top">
              <CheckCircle2 size={17} />
              <span>Connected platform</span>
            </div>

            <div className="marketing-demo-floating floating-bottom">
              <MessageCircle size={17} />
              <span>Let's talk business</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
