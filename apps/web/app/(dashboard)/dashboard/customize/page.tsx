'use client';

import { useState } from 'react';
import { useDashboardData } from '@/context/DashboardDataContext';
import MobilePageTitle from '../components/mobile-page-title';
import { Palette, Image, Briefcase, Share2, Eye } from 'lucide-react';
import BrandingEditor from './components/branding-editor';
import GalleryManager from './components/gallery-manager';
import ServicesManager from './components/services-manager';
import SocialLinksManager from './components/social-manager';

type TabType = 'branding' | 'gallery' | 'services' | 'social';

export default function CustomizePage() {
  const [activeTab, setActiveTab] = useState<TabType>('branding');
  const { tenant } = useDashboardData();

  const tabs = [
    { id: 'branding' as TabType, label: 'Branding', icon: Palette },
    { id: 'gallery' as TabType, label: 'Gallery', icon: Image },
    { id: 'services' as TabType, label: 'Services', icon: Briefcase },
    { id: 'social' as TabType, label: 'Social', icon: Share2 },
  ];

  const handlePreview = () => {
    const tenantSlug = tenant?.slug ?? tenant?.id ?? 'default';
    window.open(`/${tenantSlug}?preview=true`, '_blank');
  };

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <MobilePageTitle title="Customize" />
        <button
          onClick={handlePreview}
          style={{
            border: '1px solid var(--card-border)',
            background: 'var(--card)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Eye size={16} />
          Preview
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginBottom: 20,
          paddingBottom: 2,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto',
                border: isActive ? '2px solid #3b82f6' : '1px solid var(--card-border)',
                background: isActive ? '#eff6ff' : 'var(--card)',
                borderRadius: 10,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: isActive ? '#3b82f6' : 'var(--muted)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'branding' && <BrandingEditor />}
        {activeTab === 'gallery' && <GalleryManager />}
        {activeTab === 'services' && <ServicesManager />}
        {activeTab === 'social' && <SocialLinksManager />}
      </div>
    </div>
  );
}
