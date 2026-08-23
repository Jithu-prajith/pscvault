import React from 'react';
import { User as UserIcon, Cloud, CloudOff, RefreshCw, LogOut, Laptop, Smartphone, ShieldCheck, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { formatISTDateTime } from '../../lib/utils';

export const UserProfileModal: React.FC = () => {
  const isOpen = useAuthStore((s) => s.profileModalOpen);
  const close = useAuthStore((s) => s.setProfileModalOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const lastSyncTime = useAuthStore((s) => s.lastSyncTime);
  const setSyncStatus = useAuthStore((s) => s.setSyncStatus);

  if (!isOpen || !user) return null;

  const handleManualSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced', new Date().toISOString());
    }, 1200);
  };

  const handleLogout = () => {
    logout();
    close(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/10 text-brand-500 border border-brand-500/20 flex items-center justify-center font-bold text-xl">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">{user.name}</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {syncStatus === 'synced' ? (
              <Cloud className="w-6 h-6 text-emerald-500 shrink-0" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-6 h-6 text-brand-500 animate-spin shrink-0" />
            ) : (
              <CloudOff className="w-6 h-6 text-amber-500 shrink-0" />
            )}

            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {syncStatus === 'synced' ? '☁ Cloud Synced' : syncStatus === 'syncing' ? '⟳ Syncing Data...' : 'Offline Mode'}
              </div>
              <div className="text-[10px] text-slate-400">
                Last sync: {lastSyncTime ? formatISTDateTime(lastSyncTime) : 'Never'}
              </div>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            className="px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 rounded-xl text-xs font-bold transition-colors"
          >
            Sync Now
          </button>
        </div>

        {/* Account Details */}
        <div className="flex flex-col gap-3 text-xs mb-6">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-500 dark:text-slate-400">Target Exam Year</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user.preferences?.targetExamYear || 'UPSC CSE 2027'}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-500 dark:text-slate-400">Architecture</span>
            <span className="font-bold text-emerald-500">Local-First + Cloud Sync</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex flex-col gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Active Devices</span>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-brand-400" />
                <span>Windows Laptop (This Device)</span>
              </span>
              <span className="text-emerald-500 font-bold">Active</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
