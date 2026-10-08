import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Download, Info, Maximize2, Minimize2, Calendar, FileText, HardDrive, Crop } from 'lucide-react';
import { Photo } from '../types';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onRequestDelete: (photo: Photo) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onRequestDelete,
}) => {
  const [showMetadata, setShowMetadata] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const activePhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(photos.length - 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowMetadata((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  if (!isOpen || !activePhoto) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleDownload = () => {
    if (!activePhoto.signedUrl) return;
    const a = document.createElement('a');
    a.href = activePhoto.signedUrl;
    a.download = activePhoto.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-stone-100 flex flex-col select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
            {currentIndex + 1} / {photos.length}
          </span>
          <h2 className="text-sm font-semibold truncate text-stone-200">
            {activePhoto.file_name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Metadata toggle */}
          <button
            onClick={() => setShowMetadata((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors text-xs flex items-center gap-1.5 ${
              showMetadata
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            title="Toggle Info (I)"
            aria-label="Toggle Info"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Info</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Download original"
            aria-label="Download photo"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onRequestDelete(activePhoto)}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete photo"
            aria-label="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-stone-800 mx-1" />

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close viewer (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-between min-h-0 overflow-hidden">
        {/* Navigation Previous */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 shadow-xl transition-all duration-150 backdrop-blur-sm"
            aria-label="Previous photo (Left arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Image Container */}
        <div className="flex-1 h-full flex items-center justify-center p-4 sm:p-8 min-w-0">
          {imageError ? (
            <div className="text-center p-8 bg-stone-900/60 rounded-2xl border border-stone-800 max-w-sm">
              <p className="text-sm font-semibold text-stone-300">Image could not be rendered</p>
              <p className="text-xs text-stone-500 mt-1">
                The signed URL may have expired or the file could not be read from Supabase Storage.
              </p>
            </div>
          ) : (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={activePhoto.signedUrl}
                alt={activePhoto.file_name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="max-h-[calc(100vh-8rem)] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
              />
            </div>
          )}
        </div>

        {/* Navigation Next */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className={`absolute z-20 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 shadow-xl transition-all duration-150 backdrop-blur-sm ${
              showMetadata ? 'right-4 sm:right-84' : 'right-4'
            }`}
            aria-label="Next photo (Right arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Metadata Sidebar (Collapsible) */}
        {showMetadata && (
          <div className="w-80 shrink-0 h-full border-l border-stone-800/80 bg-stone-950/90 backdrop-blur-md p-6 flex flex-col justify-between overflow-y-auto z-10 transition-all duration-200">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Photo Details
                </span>
                <h3 className="text-base font-semibold text-stone-100 mt-1 break-words">
                  {activePhoto.file_name}
                </h3>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <Crop className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-stone-500 text-[11px] block">Dimensions</span>
                    <span className="font-medium text-stone-200">
                      {activePhoto.width && activePhoto.height
                        ? `${activePhoto.width} × ${activePhoto.height} px`
                        : 'Not recorded'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <HardDrive className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-stone-500 text-[11px] block">File Size</span>
                    <span className="font-medium text-stone-200">
                      {formatFileSize(activePhoto.file_size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-stone-500 text-[11px] block">MIME Type</span>
                    <span className="font-medium text-stone-200">{activePhoto.mime_type}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <Calendar className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-stone-500 text-[11px] block">Uploaded Date</span>
                    <span className="font-medium text-stone-200">
                      {formatDate(activePhoto.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supabase Storage Path Info */}
              <div className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-800 text-xs">
                <span className="text-stone-500 text-[11px] block mb-1">
                  Supabase Storage Bucket Path
                </span>
                <p className="font-mono text-[11px] text-stone-300 break-all bg-stone-950 p-2 rounded-lg border border-stone-800/60">
                  photos/{activePhoto.file_path}
                </p>
                <p className="text-[10px] text-stone-500 mt-2">
                  Protected by Row Level Security and signed token URLs.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
              <span>Keys: ← / → / Esc</span>
              <button
                onClick={() => onRequestDelete(activePhoto)}
                className="text-rose-400 hover:text-rose-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
