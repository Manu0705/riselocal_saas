'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Upload, Loader2, X, Plus, Edit2, Check, AlertCircle } from 'lucide-react';
import CustomizePanelSkeleton from './customize-panel-skeleton';
import PageErrorState from '@/components/page-error-state';
import { getTenantApiClient } from '@/lib/tenant-client';

interface GalleryImage {
  id: string;
  url: string;
  category: string;
  position: number;
  alt?: string;
}

const DEFAULT_CATEGORIES = ['gallery', 'before-after', 'team', 'workspace'];
const MAX_BATCH_UPLOAD = 20;

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('gallery');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editDraftName, setEditDraftName] = useState('');
  const [addingNewCategory, setAddingNewCategory] = useState(false);

  useEffect(() => {
    loadImages();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/settings');
      if (response?.data?.galleryCategories && Array.isArray(response.data.galleryCategories)) {
        const loaded = response.data.galleryCategories;
        setCategories(loaded);
        if (loaded.length > 0 && !loaded.includes(selectedCategory)) {
          setSelectedCategory(loaded[0]);
        }
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const loadImages = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/gallery');
      if (response?.data) {
        setImages(response.data);
        setError(null);
      } else if (response?.error) {
        setError(response.error);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((file) => file.size > 0);
    if (files.length === 0) return;

    if (files.length > MAX_BATCH_UPLOAD) {
      setError(`You can upload up to ${MAX_BATCH_UPLOAD} images at once.`);
      setSuccess(null);
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    setError(null);
    setSuccess(null);

    try {
      const api = getTenantApiClient();

      const createdImages: GalleryImage[] = [];
      let uploadedCount = 0;
      const failedUploads: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setUploadProgress({ current: index + 1, total: files.length });

        try {
          const formData = new FormData();
          formData.append('file', file);
          const uploadResponse = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (!uploadResponse?.url) {
            const uploadError =
              uploadResponse?.error || uploadResponse?.message || 'Upload service did not return a URL.';
            throw new Error(String(uploadError));
          }

          const createResponse = await api.post('/gallery', {
            url: uploadResponse.url,
            category: selectedCategory,
            alt: file.name,
          });

          if (!createResponse?.data) {
            const createError =
              createResponse?.error || createResponse?.message || 'Gallery record creation failed.';
            throw new Error(String(createError));
          }

          createdImages.push(createResponse.data as GalleryImage);
          uploadedCount += 1;
        } catch (uploadError) {
          const reason = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          failedUploads.push(`${file.name}: ${reason}`);
        }
      }

      if (createdImages.length > 0) {
        setImages((prev) => [...prev, ...createdImages]);
      }

      if (uploadedCount > 0 && failedUploads.length === 0) {
        setSuccess(
          `${uploadedCount} image${uploadedCount === 1 ? '' : 's'} uploaded successfully to "${selectedCategory}".`,
        );
      } else if (uploadedCount > 0 && failedUploads.length > 0) {
        setSuccess(
          `${uploadedCount} image${uploadedCount === 1 ? '' : 's'} uploaded. ${failedUploads.length} failed.`,
        );
        setError(failedUploads.slice(0, 3).join(' | '));
      } else {
        setError(failedUploads.slice(0, 3).join(' | ') || 'Failed to upload selected images.');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      setError(null);
      const api = getTenantApiClient();
      await api.delete(`/gallery/${id}`);
      setImages(images.filter((img) => img.id !== id));
      setSuccess('Image deleted successfully');
      globalThis.setTimeout(() => setSuccess(null), 2500);
    } catch (error) {
      console.error('Failed to delete image:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete image.');
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

  const saveCategories = async (newCategories: string[]) => {
    try {
      const api = getTenantApiClient();
      const response = await api.put('/settings', {
        galleryCategories: newCategories,
      });
      if (response?.data) {
        setCategories(newCategories);
        setSuccess('Categories updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Failed to save categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to save categories');
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some((cat) => cat.toLowerCase() === trimmed.toLowerCase())) {
      setError('This category already exists');
      return;
    }

    const updated = [...categories, trimmed];
    setNewCategoryName('');
    setAddingNewCategory(false);
    await saveCategories(updated);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (
      categories.some((cat) => cat.toLowerCase() === trimmed.toLowerCase()) &&
      trimmed.toLowerCase() !== oldName.toLowerCase()
    ) {
      setError('This category already exists');
      return;
    }

    const updated = categories.map((cat) => (cat === oldName ? trimmed : cat));
    setEditingCategory(null);

    // Also update all images in this category
    const imagesToUpdate = images.filter((img) => img.category === oldName);
    for (const img of imagesToUpdate) {
      try {
        await getTenantApiClient().put(`/gallery/${img.id}`, { category: trimmed });
      } catch (error) {
        console.error(`Failed to update image ${img.id}:`, error);
      }
    }

    setImages(images.map((img) => (img.category === oldName ? { ...img, category: trimmed } : img)));
    await saveCategories(updated);
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const imagesInCategory = images.filter((img) => img.category === categoryToDelete);
    if (imagesInCategory.length > 0) {
      setError(
        `Cannot delete "${categoryToDelete}" - it has ${imagesInCategory.length} image(s). Please move or delete the images first.`,
      );
      return;
    }

    const updated = categories.filter((cat) => cat !== categoryToDelete);
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory(updated[0] || 'gallery');
    }
    await saveCategories(updated);
  };

  const imagesByCategory = images.filter((img) => img.category === selectedCategory);

  if (loading) {
    return <CustomizePanelSkeleton title="Loading gallery..." />;
  }

  if (error && images.length === 0) {
    return (
      <PageErrorState
        title="Gallery could not be loaded"
        message={error}
        retryLabel="Retry gallery"
        onRetry={() => {
          setLoading(true);
          setError(null);
          void Promise.all([loadImages(), loadCategories()]);
        }}
      />
    );
  }

  return (
    <div>
      {/* Status Messages */}
      {error && (
        <div
          style={{
            border: '1px solid #fca5a5',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            marginBottom: 16,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div
          style={{
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#16a34a',
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {/* Category Management Section */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Gallery Categories</h3>
          {!addingNewCategory && (
            <button
              type="button"
              onClick={() => setAddingNewCategory(true)}
              style={{
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={14} />
              Add Category
            </button>
          )}
        </div>

        {/* Add New Category Input */}
        {addingNewCategory && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="e.g., blinds, zebra, folds..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory();
                }
              }}
              style={{
                flex: 1,
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddCategory}
              style={{
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Check size={14} />
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingNewCategory(false);
                setNewCategoryName('');
              }}
              style={{
                border: '1px solid var(--card-border)',
                background: 'transparent',
                color: 'var(--muted)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const isEditing = editingCategory === cat;
            const imageCount = images.filter((img) => img.category === cat).length;
            return (
              <div
                key={cat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'var(--background)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 20,
                  fontSize: 13,
                  textTransform: 'capitalize',
                }}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editDraftName}
                      onChange={(e) => setEditDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameCategory(cat, editDraftName || cat);
                        }
                      }}
                      style={{
                        border: '1px solid #3b82f6',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 12,
                        width: 100,
                      }}
                      autoFocus
                    />
                    <Check
                      size={14}
                      style={{ cursor: 'pointer', color: '#16a34a' }}
                      onClick={() => handleRenameCategory(cat, editDraftName || cat)}
                    />
                  </>
                ) : (
                  <>
                    <span>
                      {cat} ({imageCount})
                    </span>
                    <Edit2
                      size={12}
                      style={{ cursor: 'pointer', color: 'var(--muted)', marginLeft: 4 }}
                      onClick={() => {
                        setEditingCategory(cat);
                        setEditDraftName(cat);
                      }}
                    />
                    {categories.length > 1 && imageCount === 0 && (
                      <X
                        size={12}
                        style={{ cursor: 'pointer', color: '#dc2626' }}
                        onClick={() => handleDeleteCategory(cat)}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {categories.map((cat) => (
          <button
            type="button"
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
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              Uploading...
              {uploadProgress ? ` (${uploadProgress.current}/${uploadProgress.total})` : ''}
            </div>
          </>
        ) : (
          <>
            <Upload size={24} style={{ marginBottom: 8, color: 'var(--muted)' }} />
            <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
              Click to upload up to 20 images
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Will be added to &quot;{selectedCategory}&quot; category
            </div>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files?.length) {
              void handleUpload(e.target.files);
            }
            e.currentTarget.value = '';
          }}
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
              <Image
                src={image.url}
                alt={image.alt || 'Gallery image'}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                quality={75}
                priority={false}
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
                  type="button"
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
