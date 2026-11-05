import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Linkedin, Instagram, Facebook } from 'lucide-react';
import styles from '../marketing-pages.module.css';

const platformLinks = [
  { label: 'Platform overview', href: '/platform' },
  { label: 'Features', href: '/platform#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Book a demo', href: '/book-demo' },
];

const solutionLinks = [
  { label: 'Hostels & PGs', href: '/solutions/hostels-pg' },
  { label: 'Dining', href: '/solutions/dining' },
  { label: 'Professionals', href: '/solutions/professionals' },
  { label: 'Agencies', href: '/solutions/agencies' },
];

const companyLinks = [
  { label: 'About us', href: '/about-us' },
  { label: 'Contact us', href: '/contact' },
  { label: 'Resources', href: '/resources' },
];

export default function MarketingFooter() {
  return (
    <footer className={`marketing-footer ${styles.footer}`}>
      <div className="marketing-container">
        <div className="marketing-footer-main">
          {/* Brand information */}
          <div className="marketing-footer-brand">
            <Link href="/" className="marketing-footer-logo" aria-label="Riselocal homepage">
              <Image
                src="/logo/riselocal-logo.png"
                alt="Riselocal logo"
                width={100}
                height={100}
              />
              <span className="marketing-footer-wordmark">RiseLocal</span>
            </Link>

            <p className="marketing-footer-description">
              One connected platform for your online presence, customer relationships and everyday
              business operations.
            </p>

            <Link href="/book-demo" className="marketing-footer-demo-link">
              Explore Riselocal
              <ArrowUpRight size={17} />
            </Link>

            <div className="marketing-footer-socials">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>

              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Platform links */}
          <div className="marketing-footer-column">
            <h3>Platform</h3>

            <ul>
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="marketing-footer-column">
            <h3>Solutions</h3>

            <ul>
              {solutionLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="marketing-footer-column">
            <h3>Company</h3>

            <ul>
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="marketing-footer-column marketing-footer-contact">
            <h3>Get in touch</h3>

            <p>Have questions about Riselocal? Our team is here to help.</p>

            <div className="marketing-footer-contact-item">
              <Mail size={17} />
              <Link href="/contact">Contact our team</Link>
            </div>

            <div className="marketing-footer-contact-item">
              <MapPin size={17} />
              <span>India</span>
            </div>
          </div>
        </div>

        <div className="marketing-footer-divider" />

        <div className="marketing-footer-bottom">
          <p>© {new Date().getFullYear()} Riselocal. All rights reserved.</p>

          <div className="marketing-footer-legal">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms & Conditions</Link>
          </div>

          <Link href="#top" className="marketing-footer-back-top">
            Back to top
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
