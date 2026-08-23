import React, { useEffect, useState } from 'react';
import { HardDrive, X, Download, Upload, FolderOpen, RefreshCw, FileText, Image, Music, Film, File } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useAttachmentRepo } from '../../infrastructure/RepositoryProvider';
import { StorageStats } from '../../domain/types';
import { formatBytes } from '../../lib/utils';
import { createBackupData, restoreBackupData } from '../../infrastructure/backup/backupService';

export const StorageManagerModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.storageManagerOpen);
  const close = useUIStore((s) => s.setStorageManagerOpen);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);
  const attachmentRepo = useAttachmentRepo();

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const data = await attachmentRepo.getStorageStats(currentWorkspace.id);
      setStats(data);
    } catch (e) {
      console.warn('Storage stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadStats();
  }, [isOpen, currentWorkspace]);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    if (!currentWorkspace) return;
    const backupJson = await createBackupData(currentWorkspace.id);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pscvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const text = await file.text();
      const res = await restoreBackupData(text);
      alert(res.message);
      if (res.success) loadStats();
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-base">
            <HardDrive className="w-5 h-5 text-brand-500" />
            <span>Storage & Backup Manager</span>
          </div>
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Storage Meter */}
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <span>Local Storage Used</span>
              <span className="font-mono text-brand-500 font-bold">{formatBytes(stats?.totalSize || 0)}</span>
            </div>
            
            {/* Visual Bar */}
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${Math.min(100, ((stats?.pdfSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-red-500" title="PDFs" />
              <div style={{ width: `${Math.min(100, ((stats?.imageSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-blue-500" title="Images" />
              <div style={{ width: `${Math.min(100, ((stats?.audioSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-emerald-500" title="Audio" />
              <div style={{ width: `${Math.min(100, ((stats?.documentSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-amber-500" title="Documents" />
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <div className="text-slate-500 dark:text-slate-400">PDF Documents</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes(stats?.pdfSize || 0)}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <Image className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <div className="text-slate-500 dark:text-slate-400">Images</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes(stats?.imageSize || 0)}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <Music className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-slate-500 dark:text-slate-400">Voice & Audio</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes(stats?.audioSize || 0)}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <File className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-slate-500 dark:text-slate-400">Documents & Other</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes((stats?.documentSize || 0) + (stats?.otherSize || 0))}</div>
              </div>
            </div>
          </div>

          {/* Database & Filesystem Status */}
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs flex items-center justify-between text-brand-700 dark:text-brand-300">
            <span>SQLite Database File Size</span>
            <span className="font-mono font-bold">{formatBytes(stats?.databaseSize || 1024 * 1024)}</span>
          </div>

          {/* Backup & Restore Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Backup & Recovery
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Create Full Backup</span>
              </button>

              <button
                onClick={handleImportBackup}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Backup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
