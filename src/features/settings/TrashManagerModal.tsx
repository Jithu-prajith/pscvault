import React, { useEffect, useState } from 'react';
import { Trash2, HardDrive, X, RefreshCw, AlertTriangle, RotateCcw, FileText, Image, Music, File, Folder } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageRepo, useAttachmentRepo } from '../../infrastructure/RepositoryProvider';
import { StorageStats, PageSummary, Attachment } from '../../domain/types';
import { formatBytes, formatISTDateTime } from '../../lib/utils';
import { createBackupData, restoreBackupData } from '../../infrastructure/backup/backupService';

export const TrashManagerModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.storageManagerOpen);
  const close = useUIStore((s) => s.setStorageManagerOpen);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);

  const pageRepo = usePageRepo();
  const attachmentRepo = useAttachmentRepo();
  const setPages = useWorkspaceStore((s) => s.setPages);
  const activeSectionId = useWorkspaceStore((s) => s.activeSectionId);

  const [activeTab, setActiveTab] = useState<'trash' | 'storage'>('trash');
  const [deletedPages, setDeletedPages] = useState<PageSummary[]>([]);
  const [deletedAttachments, setDeletedAttachments] = useState<Attachment[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [delPgs, delAtts, st] = await Promise.all([
        pageRepo.getDeleted(currentWorkspace.id),
        attachmentRepo.getDeleted(currentWorkspace.id),
        attachmentRepo.getStorageStats(currentWorkspace.id),
      ]);

      setDeletedPages(delPgs);
      setDeletedAttachments(delAtts);
      setStats(st);
    } catch (e) {
      console.warn('Trash load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, currentWorkspace]);

  if (!isOpen) return null;

  const handleRestorePage = async (pg: PageSummary) => {
    await pageRepo.restore(pg.id);
    if (activeSectionId) {
      const updated = await pageRepo.getBySection(activeSectionId);
      setPages(updated);
    }
    await loadData();
  };

  const handlePermanentDeletePage = async (pg: PageSummary) => {
    if (!confirm(`Permanently delete "${pg.title}"?\nThis action cannot be undone.`)) return;
    await pageRepo.permanentDelete(pg.id);
    await loadData();
  };

  const handleRestoreAttachment = async (att: Attachment) => {
    await attachmentRepo.restore(att.id);
    await loadData();
  };

  const handlePermanentDeleteAttachment = async (att: Attachment) => {
    if (!confirm(`Permanently delete file "${att.originalFileName}"?\nThis action cannot be undone.`)) return;
    await attachmentRepo.permanentDelete(att.id);
    await loadData();
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Empty Trash?\nAll items in Trash will be permanently deleted from this account and cannot be restored.')) return;

    for (const pg of deletedPages) {
      await pageRepo.permanentDelete(pg.id);
    }
    for (const att of deletedAttachments) {
      await attachmentRepo.permanentDelete(att.id);
    }

    await loadData();
  };

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
      if (res.success) loadData();
    };
    input.click();
  };

  const totalTrashCount = deletedPages.length + deletedAttachments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header with Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('trash')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'trash'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Trash ({totalTrashCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'storage'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Storage & Backup</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'trash' && totalTrashCount > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            )}

            <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Trash View */}
        {activeTab === 'trash' ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {totalTrashCount === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span>Trash is empty. Deleted chapters, topics, notes, and attachments will appear here.</span>
              </div>
            ) : (
              <>
                {/* Deleted Pages / Chapters / Topics */}
                {deletedPages.map((pg) => (
                  <div
                    key={pg.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg shrink-0">{pg.icon || (pg.type === 'chapter' ? '📁' : '📄')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{pg.title}</h4>
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold">
                            {pg.type || 'page'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Deleted: {formatISTDateTime(pg.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => handleRestorePage(pg)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                        title="Restore to original path"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => handlePermanentDeletePage(pg)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Deleted Attachments */}
                {deletedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{att.originalFileName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">({formatBytes(att.fileSize)})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Deleted: {formatISTDateTime(att.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => handleRestoreAttachment(att)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => handlePermanentDeleteAttachment(att)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* Tab 2: Storage & Backup View */
          <div className="p-5 flex flex-col gap-5 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <span>Local Storage Used</span>
                <span className="font-mono text-brand-500 font-bold">{formatBytes(stats?.totalSize || 0)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${Math.min(100, ((stats?.pdfSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-red-500" title="PDFs" />
                <div style={{ width: `${Math.min(100, ((stats?.imageSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-blue-500" title="Images" />
                <div style={{ width: `${Math.min(100, ((stats?.audioSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-emerald-500" title="Audio" />
                <div style={{ width: `${Math.min(100, ((stats?.documentSize || 0) / (stats?.totalSize || 1)) * 100)}%` }} className="bg-amber-500" title="Documents" />
              </div>
            </div>

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
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleExportBackup}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow transition-colors"
              >
                Create Full Backup
              </button>
              <button
                onClick={handleImportBackup}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Restore Backup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
