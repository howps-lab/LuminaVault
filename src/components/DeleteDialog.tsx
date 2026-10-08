import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Photo } from '../types';

interface DeleteDialogProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  photo,
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen || !photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-stone-200">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-stone-100">
          Delete photo permanently?
        </h3>

        <p className="mt-2 text-xs text-stone-400 leading-relaxed">
          Are you sure you want to delete <strong className="text-stone-200">{photo.file_name}</strong>?
          This will permanently remove both the file from <strong>Supabase Storage</strong> and its metadata record from the <strong>photos</strong> table. This action cannot be undone.
        </p>

        {photo.signedUrl && (
          <div className="mt-3.5 w-full h-24 rounded-xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center">
            <img
              src={photo.signedUrl}
              alt={photo.file_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold tracking-wide transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
