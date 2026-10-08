import React from 'react';
import { Camera, UploadCloud, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onOpenUpload: () => void;
  onExploreDemo?: () => void;
  isDemoUser?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenUpload, onExploreDemo, isDemoUser }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-3xl border border-dashed border-stone-800 bg-stone-900/30 max-w-xl mx-auto my-12">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 shadow-inner">
        <Camera className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-stone-100">
        No photos yet in your vault
      </h3>

      <p className="mt-2 text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
        Upload your first photo to get started. High-resolution photos are securely stored in your private Supabase Storage bucket and indexed in Postgres.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Your First Photo
        </button>

        {onExploreDemo && !isDemoUser && (
          <button
            onClick={onExploreDemo}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Load Sample Gallery
          </button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-stone-800/80 flex items-center gap-2 text-xs text-stone-500">
        <span>Drag & drop ready</span>
        <span aria-hidden="true">·</span>
        <span>Row Level Security</span>
        <span aria-hidden="true">·</span>
        <span>Signed URL Privacy</span>
      </div>
    </div>
  );
};
