import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, AlertCircle, CheckCircle2, Trash2, Loader2, ArrowUpCircle } from 'lucide-react';
import { UploadItem } from '../types';
import { uploadSinglePhoto } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onShowToast,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const extractImageDimensions = (file: File): Promise<{ width: number | null; height: number | null }> => {
    return new Promise((resolve) => {
      // For images that browser can decode into Image object
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        resolve({ width: null, height: null });
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        resolve({ width: null, height: null });
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });
  };

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const errors: string[] = [];
    const newItems: UploadItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Check size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds the 10 MB maximum file limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        continue;
      }

      // Check mime/ext
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || ALLOWED_EXTENSIONS.includes(ext);

      if (!isAllowedType) {
        errors.push(`"${file.name}" is not a supported format (Only JPEG, PNG, WebP, HEIC).`);
        continue;
      }

      const { width, height } = await extractImageDimensions(file);
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        progress: 0,
        status: 'pending',
        width,
        height,
      });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleStartUpload = async () => {
    if (items.length === 0 || isUploading) return;

    setIsUploading(true);
    setValidationErrors([]);
    let successfulUploadsCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'success') {
        successfulUploadsCount++;
        continue;
      }

      // Update status to uploading
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 10 } : it))
      );

      try {
        await uploadSinglePhoto({
          user,
          file: item.file,
          width: item.width,
          height: item.height,
          onProgress: (pct) => {
            setItems((prev) =>
              prev.map((it) => (it.id === item.id ? { ...it, progress: pct } : it))
            );
          },
        });

        successfulUploadsCount++;
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'success', progress: 100 } : it
          )
        );
      } catch (err: any) {
        console.error('Failed to upload', item.file.name, err);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', errorMessage: err?.message || 'Upload failed.' }
              : it
          )
        );
      }
    }

    setIsUploading(false);

    if (successfulUploadsCount > 0) {
      onShowToast(
        'Upload Complete',
        `Successfully uploaded ${successfulUploadsCount} photo${successfulUploadsCount > 1 ? 's' : ''}.`,
        'success'
      );
      onUploadSuccess();
      // If all succeeded, close after a brief delay
      if (successfulUploadsCount === items.length) {
        setTimeout(() => {
          onClose();
          setItems([]);
        }, 800);
      }
    }
  };

  const totalFiles = items.length;
  const completedFiles = items.filter((i) => i.status === 'success').length;
  const overallPercentage =
    totalFiles === 0
      ? 0
      : Math.round(
          items.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalFiles
        );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-stone-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              Upload Photos to Vault
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Files are saved to Supabase Storage with metadata in Postgres.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Some files could not be added:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-300 pl-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                : 'border-stone-800 hover:border-stone-700 bg-stone-950/40'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelected(e.target.files);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <ArrowUpCircle className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-stone-200">
              Drag and drop high-res images here, or{' '}
              <span className="text-amber-400 underline decoration-amber-400/40 underline-offset-4">
                browse files
              </span>
            </p>

            <div className="mt-2 text-xs text-stone-500 flex items-center gap-2">
              <span>JPEG, PNG, WebP, HEIC</span>
              <span aria-hidden="true">·</span>
              <span>Up to 10 MB each</span>
              <span aria-hidden="true">·</span>
              <span>Multi-file support</span>
            </div>
          </div>

          {/* Selected Files Queue */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-stone-400">
                <span>
                  Selected Photos ({items.length})
                </span>
                {isUploading && (
                  <span className="text-amber-400 flex items-center gap-1.5 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Overall: {overallPercentage}% ({completedFiles}/{totalFiles})
                  </span>
                )}
              </div>

              {/* Progress Bar Container for Overall Upload */}
              {isUploading && (
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                    style={{ width: `${overallPercentage}%` }}
                  />
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const isPending = item.status === 'pending';
                  const isCurrentUploading = item.status === 'uploading';
                  const isDone = item.status === 'success';
                  const isErr = item.status === 'error';

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs"
                    >
                      {/* Thumbnail preview */}
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-stone-800 shrink-0 border border-stone-700/60 relative">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-stone-600 m-auto mt-3" />
                        )}
                      </div>

                      {/* Info & Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-stone-200 truncate">{item.file.name}</p>
                          <span className="text-[11px] text-stone-500 shrink-0">
                            {formatFileSize(item.file.size)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          {item.width && item.height && (
                            <>
                              <span>{item.width} × {item.height} px</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span>{item.file.type || 'image'}</span>
                        </div>

                        {/* Individual Progress bar */}
                        {isCurrentUploading && (
                          <div className="mt-1.5 w-full bg-stone-800 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-amber-400 h-1 transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                        {isErr && (
                          <p className="mt-1 text-[11px] text-rose-400 truncate">
                            {item.errorMessage || 'Upload failed'}
                          </p>
                        )}
                      </div>

                      {/* Status / Action */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isDone && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                            <CheckCircle2 className="w-4 h-4" />
                            Saved
                          </span>
                        )}
                        {isCurrentUploading && (
                          <span className="text-amber-400 font-mono text-[11px]">
                            {item.progress}%
                          </span>
                        )}
                        {isPending && !isUploading && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors"
                            aria-label="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-300 hover:text-stone-100 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Add More Photos
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStartUpload}
              disabled={items.length === 0 || isUploading || items.every((i) => i.status === 'success')}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload {items.length > 0 ? `(${items.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
