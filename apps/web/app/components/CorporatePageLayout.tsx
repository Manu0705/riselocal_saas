import type { ReactNode } from 'react';
import Image from 'next/image';
import MarketingFooter from './marketing/MarketingFooter';
import MarketingHeader from './marketing/MarketingHeader';
import styles from './marketing-pages.module.css';

interface CorporatePageLayoutProps {
  children: ReactNode;
}

interface CorporatePageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  children?: ReactNode;
}

export function CorporatePageLayout({ children }: CorporatePageLayoutProps) {
  return (
    <div className={`marketing-site ${styles.site}`} id="top">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function CorporatePageHero({
  eyebrow,
  title,
  description,
  image,
  children,
}: CorporatePageHeroProps) {
  return (
    <section className="corp-hero">
      <div className="corp-container">
        <div className={`corp-hero__layout${image ? ' corp-hero__layout--with-image' : ''}`}>
          <div className="corp-hero__content">
            <p className="corp-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="corp-lead">{description}</p>
            {children ? <div className="corp-hero__actions">{children}</div> : null}
          </div>
          {image ? (
            <figure className="corp-hero__artwork">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 760px) 100vw, 48vw"
                priority
              />
              {image.caption ? <figcaption>{image.caption}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}
