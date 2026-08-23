import React from 'react';
import { LayoutTemplate, X, BookOpen, Zap, FileText, Building, Scale, Plus } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageRepo } from '../../infrastructure/RepositoryProvider';
import { usePageStore } from '../../stores/pageStore';

export const TemplatePickerModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.templatePickerOpen);
  const close = useUIStore((s) => s.setTemplatePickerOpen);
  const activeSectionId = useWorkspaceStore((s) => s.activeSectionId);

  const pageRepo = usePageRepo();
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  if (!isOpen) return null;

  const templates = [
    {
      id: 'prelims_fact',
      title: 'Prelims Fact Sheet',
      category: 'Prelims Focus',
      icon: Zap,
      description: 'Structured layout for key facts, dates, constitutional articles, and PYQs.',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '⚡ Prelims Revision Sheet' }] },
          { type: 'callout', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key Takeaways: Remember memory hooks and historical timeline.' }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Core Facts & Data' }] },
          { type: 'bulletList', content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Constitutional Provision / Article:' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key Committee / Commission Recommendations:' }] }] },
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. High-Yield PYQ Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Write common trick statements asked in previous years...' }] },
        ]
      }
    },
    {
      id: 'mains_15marker',
      title: 'Mains 15-Marker Answer Draft',
      category: 'Mains Writing',
      icon: FileText,
      description: 'Introduction, 3 Core Dimensions, Data Points, Way Forward, and Conclusion.',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '✍️ Mains Answer Framework (250 Words)' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Question / Topic:' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Insert Mains question or topic statement here...' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Introduction (30 Words)' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Definition, Context, or Recent Report Data...' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Body Dimension 1: Key Drivers / Arguments' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Point 1 with Sub-data / Case Study' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Point 2 with Constitutional Provision' }] }] },
          ]},
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Body Dimension 2: Challenges & Bottlenecks' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Structural / Financial / Institutional Issue' }] }] },
          ]},
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Way Forward & Conclusion' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Best Practice / International Example' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'SDG Goal / Visionary Concluding Statement' }] }] },
          ]},
        ]
      }
    },
    {
      id: 'scheme_analysis',
      title: 'Government Scheme Analysis',
      category: 'Economy & Governance',
      icon: Building,
      description: 'Nodal Ministry, Objectives, Beneficiaries, Funding, Performance & Critiques.',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '🏛️ Government Scheme Breakdown' }] },
          { type: 'table', content: [
            { type: 'tableRow', content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nodal Ministry' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type (Central Sector / Sponsored)' }] }] },
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ministry of...' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Centrally Sponsored' }] }] },
            ]},
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Provisions & Targets' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Target Group:' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Financial Outlay / Subsidies:' }] }] },
          ]},
        ]
      }
    },
    {
      id: 'ethics_case_study',
      title: 'Ethics Case Study Template',
      category: 'GS4 Ethics',
      icon: Scale,
      description: 'Stakeholders, Ethical Dilemmas, Course of Action Analysis, Justification.',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '⚖️ Ethics Case Study Matrix' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Key Stakeholders Involved' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Public / District Population' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'District Magistrate / Administrator' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Contractors / Political Pressure' }] }] },
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. Core Ethical Dilemmas' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Personal Morality vs Administrative Duty' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Short-term Convenience vs Long-term Integrity' }] }] },
          ]},
        ]
      }
    }
  ];

  const handleApplyTemplate = async (tmpl: typeof templates[0]) => {
    if (!activeSectionId) {
      alert('Please select a section first.');
      return;
    }

    const page = await pageRepo.create({
      sectionId: activeSectionId,
      title: tmpl.title,
      content: tmpl.content,
    });

    setCurrentPage(page);
    setActivePageId(page.id);
    close(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-base">
            <LayoutTemplate className="w-5 h-5 text-brand-500" />
            <span>UPSC Note Templates</span>
          </div>
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between hover:border-brand-500 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs group-hover:text-brand-500 transition-colors">
                        {tmpl.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">{tmpl.category}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use Template</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
