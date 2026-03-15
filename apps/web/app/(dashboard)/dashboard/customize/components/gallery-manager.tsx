'use client';

import { useState, useEffect } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { getTenantApiClient } from '@/lib/tenant-client';

interface GalleryImage {
  id: string;
  url: string;
  category: string;
  position: number;
  alt?: string;
}

const categories = ['gallery', 'before-after', 'team', 'workspace'];

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('gallery');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/gallery');
      if (response?.data) {
        setImages(response.data);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const api = getTenantApiClient();

      // Upload image first
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadResponse?.url) {
        // Create gallery record
        const createResponse = await api.post('/gallery', {
          url: uploadResponse.url,
          category: selectedCategory,
          alt: file.name,
        });

        if (createResponse?.data) {
          setImages([...images, createResponse.data]);
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const api = getTenantApiClient();
      await api.delete(`/gallery/${id}`);
      setImages(images.filter((img) => img.id !== id));
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image.');
    }
  };

  const handleCategoryChange = async (imageId: string, newCategory: string) => {
    try {
      const api = getTenantApiClient();
      const response = await api.put(`/gallery/${imageId}`, { category: newCategory });
      if (response?.data) {
        setImages(images.map((img) => (img.id === imageId ? response.data : img)));
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const imagesByCategory = images.filter((img) => img.category === selectedCategory);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
        <Loader2 size={24} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12 }}>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              flex: '0 0 auto',
              border:
                selectedCategory === cat ? '2px solid #3b82f6' : '1px solid var(--card-border)',
              background: selectedCategory === cat ? '#eff6ff' : 'var(--card)',
              borderRadius: 8,
              padding: '8px 16px',
              color: selectedCategory === cat ? '#3b82f6' : 'var(--text)',
              fontSize: 13,
              fontWeight: selectedCategory === cat ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {cat.replace('-', ' ')} ({images.filter((img) => img.category === cat).length})
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <label
        style={{
          display: 'block',
          border: '2px dashed var(--card-border)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: 'var(--card)',
          marginBottom: 20,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? (
          <>
            <Loader2
              size={24}
              strokeWidth={2}
              style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }}
            />
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>Uploading...</div>
          </>
        ) : (
          <>
            <Upload size={24} style={{ marginBottom: 8, color: 'var(--muted)' }} />
            <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
              Click to upload image
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Will be added to &quot;{selectedCategory}&quot; category
            </div>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </label>

      {/* Gallery Grid */}
      {imagesByCategory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <p>No images in this category yet</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Upload images using the area above</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {imagesByCategory.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--card-border)',
                aspectRatio: '1',
              }}
            >
              <img
                src={image.url}
                alt={image.alt || 'Gallery image'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Overlay with actions */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <button
                  onClick={() => handleDelete(image.id)}
                  style={{
                    alignSelf: 'flex-end',
                    border: 'none',
                    background: '#dc2626',
                    borderRadius: 6,
                    padding: 6,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>

                <select
                  value={image.category}
                  onChange={(e) => handleCategoryChange(image.id, e.target.value)}
                  style={{
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
        Drag and drop reordering coming soon
      </p>
    </div>
  );
}
