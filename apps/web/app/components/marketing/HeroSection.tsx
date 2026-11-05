
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="marketing-hero">
      <div className="marketing-container marketing-hero-grid">
        {/* Left: Hero content */}
        <div className="marketing-hero-content">
          <div className="marketing-hero-eyebrow">
            <span className="marketing-hero-eyebrow-dot" />
            ONE CONNECTED BUSINESS PLATFORM
          </div>

          <h1>
            Everything your business needs to{' '}
            <span>grow, in one place.</span>
          </h1>

          <p className="marketing-hero-description">
            Build your online presence, manage customer relationships and
            organise your business operations through one connected platform.
          </p>

          <div className="marketing-hero-actions">
            <Link href="/book-demo" className="marketing-button-primary">
              Book a Demo
              <span aria-hidden="true"></span>
            </Link>

            <Link href="/solutions" className="marketing-button-secondary">
              Explore Solutions
              <span aria-hidden="true"></span>
            </Link>
          </div>

          <div className="marketing-hero-trust">
            <span className="marketing-hero-trust-icon">✓</span>
            <span>One platform. Multiple business solutions.</span>
          </div>
        </div>

        {/* Right: Illustrative dashboard preview */}
        <div className="marketing-hero-visual">
          <div className="marketing-hero-glow" />

          <div className="marketing-dashboard-preview">
            <div className="preview-topbar">
              <div className="preview-brand">
                <span className="preview-brand-mark">R</span>
                <span>Riselocal</span>
              </div>

              <div className="preview-topbar-right">
                <span className="preview-status-dot" />
                <span>Workspace</span>
                <div className="preview-avatar">A</div>
              </div>
            </div>

            <div className="preview-body">
              <aside className="preview-sidebar">
                <div className="preview-workspace-label">WORKSPACE</div>

                <div className="preview-nav-item active">
                  <span>▦</span> Overview
                </div>
                <div className="preview-nav-item">
                  <span>◉</span> Customers
                </div>
                <div className="preview-nav-item">
                  <span>▤</span> Enquiries
                </div>
                <div className="preview-nav-item">
                  <span>▣</span> Operations
                </div>
                <div className="preview-nav-item">
                  <span>⚙</span> Settings
                </div>
              </aside>

              <div className="preview-main">
                <div className="preview-heading">
                  <div>
                    <span className="preview-overline">YOUR BUSINESS</span>
                    <h3>Overview</h3>
                    <p>Manage your business from one place.</p>
                  </div>
                  <span className="preview-date">This month</span>
                </div>

                <div className="preview-stat-grid">
                  <div className="preview-stat-card">
                    <span className="preview-stat-icon blue">↗</span>
                    <span className="preview-stat-label">Enquiries</span>
                    <strong>Manage</strong>
                    <small>Track incoming enquiries</small>
                  </div>

                  <div className="preview-stat-card">
                    <span className="preview-stat-icon purple">♙</span>
                    <span className="preview-stat-label">Customers</span>
                    <strong>Organise</strong>
                    <small>Keep customer details together</small>
                  </div>

                  <div className="preview-stat-card">
                    <span className="preview-stat-icon green">▣</span>
                    <span className="preview-stat-label">Operations</span>
                    <strong>Simplify</strong>
                    <small>Coordinate daily activities</small>
                  </div>
                </div>

                <div className="preview-lower-grid">
                  <div className="preview-panel preview-activity">
                    <div className="preview-panel-heading">
                      <strong>Business activity</strong>
                      <span>Recent updates</span>
                    </div>

                    <div className="preview-activity-row">
                      <span className="preview-activity-icon blue">↗</span>
                      <div>
                        <strong>Enquiry management</strong>
                        <small>Keep track of new enquiries</small>
                      </div>
                      <span className="preview-row-arrow">→</span>
                    </div>

                    <div className="preview-activity-row">
                      <span className="preview-activity-icon purple">♙</span>
                      <div>
                        <strong>Customer management</strong>
                        <small>Keep customer information organised</small>
                      </div>
                      <span className="preview-row-arrow">→</span>
                    </div>

                    <div className="preview-activity-row">
                      <span className="preview-activity-icon green">▣</span>
                      <div>
                        <strong>Business operations</strong>
                        <small>Manage your everyday workflow</small>
                      </div>
                      <span className="preview-row-arrow">→</span>
                    </div>
                  </div>

                  <div className="preview-panel preview-platform-card">
                    <span className="preview-platform-symbol">✦</span>
                    <strong>One connected platform</strong>
                    <p>
                      Bring your online presence, customers and operations
                      together.
                    </p>
                    <span className="preview-platform-link">
                      Explore the platform →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="marketing-hero-floating-card">
            <span className="floating-card-check">✓</span>
            <div>
              <strong>Everything connected</strong>
              <small>Work from one platform</small>
            </div>
          </div> */}

          <p className="marketing-hero-visual-caption">
            Illustrative platform preview
          </p>
        </div>
      </div>
    </section>
  );
}
