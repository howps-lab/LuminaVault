import React, { useState } from 'react';
import { X, Check, Copy, Database, ShieldCheck, ExternalLink, RefreshCw, AlertTriangle, Key } from 'lucide-react';
import { SUPABASE_SQL_MIGRATION } from '../lib/sqlSchema';
import {
  getActiveSupabaseCredentials,
  setCustomCredentials,
  clearCustomCredentials,
  testSupabaseConnection,
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { isConfigured, isCustom, refreshConfig } = useAuth();
  const creds = getActiveSupabaseCredentials();

  const [activeTab, setActiveTab] = useState<'sql' | 'credentials' | 'guide'>('sql');
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(creds.url || '');
  const [keyInput, setKeyInput] = useState(creds.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopied(true);
    onShowToast('SQL Schema Copied', 'Paste into your Supabase Dashboard SQL Editor.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter both Supabase Project URL and Anon Key.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(urlInput, keyInput);
    setTesting(false);
    setTestResult(res);
  };

  const handleSaveCredentials = () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      onShowToast('Missing Fields', 'Provide both Project URL and Anon Key.', 'error');
      return;
    }
    setCustomCredentials(urlInput, keyInput);
    refreshConfig();
    onShowToast('Credentials Saved', 'App connected to your custom Supabase instance.', 'success');
  };

  const handleResetToEnv = () => {
    clearCustomCredentials();
    refreshConfig();
    const envCreds = getActiveSupabaseCredentials();
    setUrlInput(envCreds.url);
    setKeyInput(envCreds.anonKey);
    setTestResult(null);
    onShowToast('Reset Complete', 'Reverted to .env environment variables.', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-stone-100">Supabase Setup & Architecture</h2>
            <div className="ml-2 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-stone-400">
                {isConfigured ? (isCustom ? 'Custom Connected' : 'Env Connected') : 'Demo / Sandbox Mode'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-stone-800 bg-stone-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-amber-400 text-stone-100'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database & Storage SQL
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'credentials'
                ? 'border-amber-400 text-stone-100'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            API Credentials
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-amber-400 text-stone-100'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & RLS Overview
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-100">SQL Migration Script</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Creates the <code className="text-amber-300">photos</code> table, indexes, private storage bucket, and Row Level Security policies.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard' : 'Copy SQL'}
                </button>
              </div>

              <div className="relative rounded-xl border border-stone-800 bg-stone-950 p-4 font-mono text-xs overflow-x-auto text-stone-300 max-h-96">
                <pre>{SUPABASE_SQL_MIGRATION}</pre>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-700/50 text-xs space-y-1.5 text-stone-300">
                <p className="font-semibold text-stone-200">How to apply this script in Supabase:</p>
                <ol className="list-decimal list-inside space-y-1 text-stone-400 pl-1">
                  <li>Open your Supabase Project dashboard.</li>
                  <li>Click on <strong>SQL Editor</strong> in the left sidebar.</li>
                  <li>Click <strong>New query</strong>, paste the copied SQL above, and click <strong>Run</strong>.</li>
                  <li>Your private <code className="text-stone-300">photos</code> bucket and RLS policies are immediately active!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-stone-100">Supabase Connection Settings</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Connect this app to your Supabase project. You can either configure environment variables (<code className="text-amber-300">VITE_SUPABASE_URL</code> and <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code>) or input your keys below for instant browser testing.
                </p>
              </div>

              <div className="space-y-4 bg-stone-950/60 p-5 rounded-xl border border-stone-800">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 placeholder:text-stone-600 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Supabase Anon / Public Key (never use service_role)
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 placeholder:text-stone-600 text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-200'
                        : 'bg-rose-950/40 border border-rose-800/80 text-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
                  >
                    {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Test Connection
                  </button>

                  <div className="flex items-center gap-2">
                    {isCustom && (
                      <button
                        onClick={handleResetToEnv}
                        className="px-3 py-2 rounded-lg text-stone-400 hover:text-stone-200 text-xs transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                    <button
                      onClick={handleSaveCredentials}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors shadow-sm"
                    >
                      Save & Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-100">Architecture & Security Design</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/50">
                  <h4 className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Row Level Security (RLS)
                  </h4>
                  <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                    Every database operation on the <code className="text-stone-300">photos</code> table checks <code className="text-amber-300">auth.uid() = user_id</code>. Users can strictly only SELECT, INSERT, UPDATE, or DELETE records they personally own.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/50">
                  <h4 className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-400" />
                    Private Storage Bucket & Signed URLs
                  </h4>
                  <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                    The <code className="text-stone-300">photos</code> storage bucket is private. Images are never accessible publicly; clients request temporary signed URLs via <code className="text-amber-300">createSignedUrls()</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/50">
                  <h4 className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    Storage Folder Isolation
                  </h4>
                  <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                    Files are uploaded to <code className="text-stone-300">{`{user_id}/{unique_file_name}`}</code>. Storage policies ensure users cannot inspect or modify files outside their user UUID folder.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/50">
                  <h4 className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-purple-400" />
                    Orphan File Cleanup
                  </h4>
                  <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                    If an upload to Storage succeeds but the subsequent Postgres database metadata insert fails, the app automatically cleans up the uploaded file to prevent orphaned storage bloat.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://supabase.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  Supabase Official Documentation <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-500">
          <span>Postgres 15+ · Supabase Storage v2 · Row Level Security</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
