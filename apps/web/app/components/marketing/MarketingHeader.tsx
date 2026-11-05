'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface MarketingHeaderProps {
  loginHref?: string;
}

const solutions = [
  {
    title: 'Hostels & PGs',
    description: 'Manage admissions, rooms, students and fees.',
    href: '/solutions/hostels-pg',
  },
  {
    title: 'Dining',
    description: 'Build your business presence and manage customer interactions.',
    href: '/solutions/dining',
  },
  {
    title: 'Professionals',
    description: 'Organise services, enquiries and client relationships.',
    href: '/solutions/professionals',
  },
  {
    title: 'Agencies',
    description: 'Manage clients and supported business workflows.',
    href: '/solutions/agencies',
  },
];

export default function MarketingHeader({
  loginHref = '/login',
}: MarketingHeaderProps) {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenus = () => {
    setSolutionsOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="marketing-header">
      <div className="marketing-header__container">
        {/* Brand */}
        <Link
          href="/"
          className="marketing-brand"
          aria-label="Riselocal home"
          onClick={closeMenus}
        >
          <span className="marketing-brand__logo">
            <Image
              src="/logo/riselocal-logo.png"
              alt="Riselocal"
              width={64}
              height={64}
              className="marketing-brand__image"
              priority
            />
          </span>

          <span className="marketing-brand__text">
            <strong>RiseLocal</strong>
            <small>One Business Growth Platform</small>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="marketing-nav" aria-label="Main navigation">
          <Link href="/platform" className="marketing-nav__link">
            Platform
          </Link>

          <div
            className="marketing-nav__dropdown"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              type="button"
              className={`marketing-nav__link marketing-nav__trigger ${
                solutionsOpen ? 'is-open' : ''
              }`}
              aria-expanded={solutionsOpen}
              aria-controls="marketing-solutions-menu"
              onClick={() => setSolutionsOpen((open) => !open)}
            >
              Solutions
              <span className="marketing-chevron" aria-hidden="true" />
            </button>

            {solutionsOpen && (
              <div
                id="marketing-solutions-menu"
                className="marketing-mega-menu"
              >
                <div className="marketing-mega-menu__intro">
                  <span className="marketing-eyebrow">
                    INDUSTRY SOLUTIONS
                  </span>

                  <h3>Built around your business.</h3>

                  <p>
                    One connected platform with solutions designed for
                    different business workflows.
                  </p>

                  <Link
                    href="/solutions"
                    className="marketing-mega-menu__all"
                    onClick={closeMenus}
                  >
                    Explore all solutions →
                  </Link>
                </div>

                <div className="marketing-mega-menu__items">
                  {solutions.map((solution) => (
                    <Link
                      key={solution.href}
                      href={solution.href}
                      className="marketing-mega-menu__item"
                      onClick={closeMenus}
                    >
                      <span className="marketing-mega-menu__item-title">
                        {solution.title}
                      </span>

                      <span className="marketing-mega-menu__item-description">
                        {solution.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/pricing" className="marketing-nav__link">
            Pricing
          </Link>

          <Link href="/resources" className="marketing-nav__link">
            Resources
          </Link>

          <Link href="/about-us" className="marketing-nav__link">
            About Us
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="marketing-header__actions">
          <Link href={loginHref} className="marketing-login-link">
            Login
          </Link>

          <Link href="/book-demo" className="marketing-demo-button">
            Book a Demo
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="marketing-mobile-toggle"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="marketing-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div
          id="marketing-mobile-menu"
          className="marketing-mobile-menu"
        >
          <nav aria-label="Mobile navigation">
            <Link href="/platform" onClick={closeMenus}>
              Platform
            </Link>

            <div className="marketing-mobile-solutions">
              <button
                type="button"
                onClick={() => setSolutionsOpen((open) => !open)}
                aria-expanded={solutionsOpen}
              >
                Solutions
                <span className="marketing-chevron" aria-hidden="true" />
              </button>

              {solutionsOpen && (
                <div className="marketing-mobile-solutions__items">
                  {solutions.map((solution) => (
                    <Link
                      key={solution.href}
                      href={solution.href}
                      onClick={closeMenus}
                    >
                      {solution.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/pricing" onClick={closeMenus}>
              Pricing
            </Link>

            <Link href="/resources" onClick={closeMenus}>
              Resources
            </Link>

            <Link href="/about-us" onClick={closeMenus}>
              About Us
            </Link>

            <div className="marketing-mobile-menu__actions">
              <Link
                href={loginHref}
                className="marketing-login-link"
                onClick={closeMenus}
              >
                Login
              </Link>

              <Link
                href="/book-demo"
                className="marketing-demo-button"
                onClick={closeMenus}
              >
                Book a Demo →
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}