import React from 'react';
import { UploadCloud, LogOut, LogIn, Database, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenAuth: () => void;
  onOpenSetup: () => void;
  photoCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenAuth,
  onOpenSetup,
  photoCount,
}) => {
  const { user, signOut, isConfigured, isDemoUser, isCustom } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-base sm:text-lg font-bold tracking-tight text-stone-100 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Lumina Vault
          </a>
          <span className="hidden md:inline text-xs text-stone-500 font-normal">
            Supabase Cloud Storage
          </span>
        </div>

        {/* Zone 2: Nav links / actions */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-400">
          <button
            onClick={onOpenSetup}
            className="hover:text-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-stone-400" />
            Database & RLS
          </button>
          {user && (
            <span className="text-stone-500">
              {photoCount} {photoCount === 1 ? 'photo' : 'photos'} in vault
            </span>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Supabase status indicator button */}
          <button
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 hover:border-stone-700 text-xs font-medium transition-colors"
            title="Configure Supabase project connection & view SQL migration"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">
              {isConfigured ? (isCustom ? 'Supabase (Custom)' : 'Supabase (Active)') : 'Sandbox / Demo'}
            </span>
            <span className="sm:hidden">DB</span>
          </button>

          {user ? (
            <>
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Photos</span>
                <span className="sm:hidden">Upload</span>
              </button>

              <div className="h-4 w-px bg-stone-800 hidden sm:block" />

              {/* User Account & Logout */}
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-medium text-stone-200 truncate max-w-36">
                    {user.email || 'Photographer'}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {isDemoUser ? 'Demo Session' : 'Authenticated'}
                  </span>
                </div>

                <button
                  onClick={signOut}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-stone-900 transition-colors"
                  title="Sign out of Lumina Vault"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold tracking-wide transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
