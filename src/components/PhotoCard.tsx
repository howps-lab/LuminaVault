import React, { useState } from 'react';
import { Trash2, ImageOff, Maximize2 } from 'lucide-react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onOpen, onDelete }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/80 hover:border-stone-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl"
    >
      {/* Image Media Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-950">
        {/* Skeleton loading state */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 bg-stone-900 animate-pulse flex items-center justify-center">
            <span className="text-stone-700 text-xs font-mono">Loading...</span>
          </div>
        )}

        {isError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/80 p-4 text-center">
            <ImageOff className="w-6 h-6 text-stone-600 mb-1" />
            <span className="text-xs text-stone-500">Image unavailable</span>
          </div>
        ) : (
          <img
            src={photo.signedUrl}
            alt={photo.file_name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-between p-3">
          <div className="p-1.5 rounded-lg bg-stone-900/80 backdrop-blur-sm text-stone-300">
            <Maximize2 className="w-4 h-4" />
          </div>

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/60 backdrop-blur-sm transition-colors shadow-md"
            title="Delete photo"
            aria-label="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Info: Zero-pill discipline */}
      <div className="p-3.5 flex flex-col justify-between">
        <h4 className="text-xs font-medium text-stone-200 truncate group-hover:text-amber-400 transition-colors">
          {photo.file_name}
        </h4>

        {/* Unboxed metadata line with typographic bullet separators */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-1.5 font-mono">
          <span>{formatDate(photo.created_at)}</span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>{formatFileSize(photo.file_size)}</span>
          {photo.width && photo.height && (
            <>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>{photo.width}×{photo.height}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
