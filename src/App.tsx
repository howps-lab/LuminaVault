/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UploadCloud,
  Search,
  ArrowUpDown,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  FolderLock,
  Layers,
  Sparkles,
  Info,
  Database,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Photo, GallerySortBy } from './types';
import { fetchPhotos, deletePhoto } from './lib/supabase';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PhotoCard } from './components/PhotoCard';
import { Lightbox } from './components/Lightbox';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { SetupModal } from './components/SetupModal';
import { DeleteDialog } from './components/DeleteDialog';
import { EmptyState } from './components/EmptyState';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';

function AppContent() {
  const { user, loading: authLoading, isDemoUser, isConfigured, enableDemoMode } = useAuth();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<GallerySortBy>('newest');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Delete confirmation
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const data = await fetchPhotos(user);
      setPhotos(data);
    } catch (err: any) {
      console.error('Failed to load photos:', err);
      showToast('Error Loading Gallery', err?.message || 'Could not fetch photos from Supabase.', 'error');
    } finally {
      setLoadingPhotos(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!authLoading) {
      loadPhotos();
    }
  }, [authLoading, user, loadPhotos]);

  // Filter & Sort
  const filteredPhotos = useMemo(() => {
    let list = [...photos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.file_name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'largest') {
        return b.file_size - a.file_size;
      }
      if (sortBy === 'smallest') {
        return a.file_size - b.file_size;
      }
      if (sortBy === 'name') {
        return a.file_name.localeCompare(b.file_name);
      }
      return 0;
    });

    return list;
  }, [photos, searchQuery, sortBy]);

  // Handle Photo Deletion
  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);

    try {
      await deletePhoto(photoToDelete, user);

      // Immediately update local state
      setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));

      // Close lightbox if the deleted photo was open
      if (lightboxIndex !== null) {
        setLightboxIndex(null);
      }

      showToast('Photo Removed', `Deleted "${photoToDelete.file_name}" from Storage and Postgres.`, 'success');
      setPhotoToDelete(null);
    } catch (err: any) {
      console.error('Delete photo failed:', err);
      showToast('Delete Failed', err?.message || 'Could not delete photo.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalVaultSize = useMemo(() => {
    const bytes = photos.reduce((acc, curr) => acc + (curr.file_size || 0), 0);
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [photos]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 3-Zone Header */}
      <Navbar
        onOpenUpload={() => (user ? setIsUploadOpen(true) : setIsAuthOpen(true))}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSetup={() => setIsSetupOpen(true)}
        photoCount={photos.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unauthenticated Landing / Callout if user not logged in */}
        {!user && !authLoading && (
          <div className="mb-10 rounded-3xl border border-stone-800 bg-gradient-to-b from-stone-900/90 to-stone-950 p-8 sm:p-12 relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-medium">
                Cloud Photo Vault
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-100 mt-2 font-serif">
                Private, high-fidelity photo storage on Supabase
              </h1>
              <p className="mt-3 text-sm sm:text-base text-stone-400 leading-relaxed">
                Seamless multi-photo uploads, automatic image dimension extraction, private storage bucket with signed URLs, and strict PostgreSQL Row Level Security.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold tracking-wide transition-all shadow-md"
                >
                  Sign In / Create Account
                </button>
                <button
                  onClick={() => enableDemoMode()}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Try Live Sandbox Preview
                </button>
                <button
                  onClick={() => setIsSetupOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  View SQL Migration
                </button>
              </div>
            </div>

            {/* Decorative metadata badges */}
            <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Strict User Isolation (RLS)</span>
              </div>
              <span aria-hidden="true" className="text-stone-700">·</span>
              <div className="flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-amber-400" />
                <span>Private Storage Bucket</span>
              </div>
              <span aria-hidden="true" className="text-stone-700">·</span>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Signed URLs with 1h TTL</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Header Bar (When user is active) */}
        {user && (
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span>{user.email}</span>
                <span aria-hidden="true">·</span>
                <span>{isDemoUser ? 'Sandbox Storage' : 'Supabase Postgres & Storage'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100 mt-1 font-serif">
                Photo Gallery Vault
              </h1>
              {/* Unboxed metadata line with typographic bullet separators */}
              <div className="flex items-center gap-2 text-xs text-stone-400 mt-2 font-mono">
                <span>{photos.length} Total {photos.length === 1 ? 'Photo' : 'Photos'}</span>
                <span aria-hidden="true">·</span>
                <span>{totalVaultSize} Vault Storage</span>
                <span aria-hidden="true">·</span>
                <span>Bucket: photos/{'{user_id}'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadPhotos}
                disabled={loadingPhotos}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-medium transition-colors"
                title="Refresh gallery from Supabase"
                aria-label="Refresh gallery"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPhotos ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Upload New Photos
              </button>
            </div>
          </div>
        )}

        {/* Gallery Controls: Search & Sort Bar */}
        {photos.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-2xl border border-stone-800/80">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos by filename..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-stone-500 hover:text-stone-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs text-stone-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as GallerySortBy)}
                className="bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="largest">Largest Size</option>
                <option value="smallest">Smallest Size</option>
                <option value="name">File Name (A-Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* Gallery Grid or Loading Skeletons */}
        {loadingPhotos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-800/80 bg-stone-900/50 p-2.5 animate-pulse flex flex-col gap-3"
              >
                <div className="aspect-4/3 w-full bg-stone-800/60 rounded-xl" />
                <div className="h-3 w-3/4 bg-stone-800/60 rounded" />
                <div className="h-2.5 w-1/2 bg-stone-800/40 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredPhotos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onOpen={() => setLightboxIndex(index)}
                onDelete={(e) => {
                  e.stopPropagation();
                  setPhotoToDelete(photo);
                }}
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <EmptyState
            onOpenUpload={() => (user ? setIsUploadOpen(true) : setIsAuthOpen(true))}
            onExploreDemo={() => enableDemoMode()}
            isDemoUser={isDemoUser}
          />
        ) : (
          <div className="text-center py-16 bg-stone-900/30 rounded-2xl border border-stone-800/80">
            <Search className="w-8 h-8 text-stone-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-200">No photos match "{searchQuery}"</p>
            <p className="text-xs text-stone-500 mt-1">Try another search term or clear the filter.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-6 text-stone-500 text-xs mt-12 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-400">Lumina Vault</span>
            <span>·</span>
            <span>Supabase Storage & PostgreSQL Architecture</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSetupOpen(true)}
              className="hover:text-stone-300 transition-colors"
            >
              Database Schema & SQL Migration
            </button>
            <span>·</span>
            <span>Row Level Security Enforced</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadPhotos}
        onShowToast={showToast}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenSetup={() => setIsSetupOpen(true)}
        onShowToast={showToast}
      />

      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onShowToast={showToast}
      />

      <DeleteDialog
        photo={photoToDelete}
        isOpen={Boolean(photoToDelete)}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onRequestDelete={(photo) => setPhotoToDelete(photo)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
