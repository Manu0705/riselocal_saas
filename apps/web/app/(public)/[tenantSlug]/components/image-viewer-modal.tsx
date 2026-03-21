'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
  open: boolean;
  imageUrl: string;
  imageCategory: string;
  onClose: () => void;
};

export default function ImageViewerModal({
  open,
  imageUrl,
  imageCategory,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#fff',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1001,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <X size={24} />
      </button>

      {/* Image container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '100%',
          height: '100%',
        }}
      >
        <Image
          src={imageUrl}
          alt={imageCategory}
          width={800}
          height={600}
          style={{
            maxWidth: '100%',
            maxHeight: '85%',
            objectFit: 'contain',
            borderRadius: 8,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            pointerEvents: 'none',
          }}
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          quality={90}
          priority={true}
        />

        {/* Category label */}
        <p
          style={{
            marginTop: 16,
            color: '#fff',
            fontSize: 14,
            textAlign: 'center',
            textTransform: 'capitalize',
            opacity: 0.8,
          }}
        >
          {imageCategory}
        </p>
      </div>
    </div>
  );
}
