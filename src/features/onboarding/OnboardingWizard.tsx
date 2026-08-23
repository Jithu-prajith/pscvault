import React, { useState } from 'react';
import { Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { useWorkspaceRepo, useNotebookRepo, useSectionRepo, usePageRepo, useTagRepo } from '../../infrastructure/RepositoryProvider';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { seedDemoUPSCWorkspace } from '../../lib/demoData';

export const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [candidateName, setCandidateName] = useState('UPSC Aspirant');
  const [examYear, setExamYear] = useState('2027');
  const [stage, setStage] = useState<'Prelims' | 'Mains' | 'Interview' | 'Beginner'>('Mains');
  const [building, setBuilding] = useState(false);

  const workspaceRepo = useWorkspaceRepo();
  const notebookRepo = useNotebookRepo();
  const sectionRepo = useSectionRepo();
  const pageRepo = usePageRepo();
  const tagRepo = useTagRepo();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setCurrentWorkspace = useAuthStore((s) => s.setCurrentWorkspace);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const setNotebooks = useWorkspaceStore((s) => s.setNotebooks);
  const setActiveNotebookId = useWorkspaceStore((s) => s.setActiveNotebookId);
  const setActiveSectionId = useWorkspaceStore((s) => s.setActiveSectionId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilding(true);

    try {
      const userId = user?.id || 'usr_default';
      const seeded = await seedDemoUPSCWorkspace(
        workspaceRepo, notebookRepo, sectionRepo, pageRepo, tagRepo,
        userId, examYear, stage
      );

      const allWs = await workspaceRepo.getAll(userId);
      setWorkspaces(allWs);
      setCurrentWorkspace(seeded.workspace);
      setActiveWorkspaceId(seeded.workspace.id);

      const allNb = await notebookRepo.getAll(seeded.workspace.id);
      setNotebooks(allNb);
      setActiveNotebookId(seeded.notebook.id);

      if (seeded.sectionId) {
        setActiveSectionId(seeded.sectionId);
        const pgs = await pageRepo.getBySection(seeded.sectionId);
        useWorkspaceStore.getState().setPages(pgs);
      }

      if (seeded.page) {
        setActivePageId(seeded.page.id);
        setCurrentPage(seeded.page);
      }

      if (user) {
        setUser({
          ...user,
          name: candidateName,
          preferences: { ...user.preferences, onboardingCompleted: true, targetExamYear: examYear }
        });
      }

      onComplete();
    } catch (err: any) {
      console.error('Setup failed:', err);
      alert(`Setup failed: ${err?.message || err || 'Unknown error'}`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-8">
        
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 text-brand-500 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome to <span className="text-brand-500">PSCVault</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your Local-First Digital Study Operating System for Civil Services Exam
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleStartSetup} className="flex flex-col gap-6">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Candidate Name
            </label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Target Exam Year
              </label>
              <select
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="2025">UPSC CSE 2025</option>
                <option value="2026">UPSC CSE 2026</option>
                <option value="2027">UPSC CSE 2027</option>
                <option value="2028">UPSC CSE 2028</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Preparation Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Mains">Mains Answer Writing (GS1-GS4)</option>
                <option value="Prelims">Prelims Focused (GS1 & CSAT)</option>
                <option value="Beginner">Beginner / Foundation (NCERT)</option>
                <option value="Interview">Interview Stage (DAF)</option>
              </select>
            </div>
          </div>

          {/* Features highlight */}
          <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-2xl flex items-center gap-3 text-xs text-brand-700 dark:text-brand-300">
            <ShieldCheck className="w-6 h-6 text-brand-500 shrink-0" />
            <div>
              <span className="font-semibold block">Local-First Privacy Architecture</span>
              <span>All data, PDFs, audio recordings, and notes stay 100% on your local device.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={building}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {building ? (
              <span>Building Personalized Subject Architecture...</span>
            ) : (
              <>
                <span>Launch PSCVault</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
