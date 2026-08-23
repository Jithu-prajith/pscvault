import React, { createContext, useContext, useMemo } from 'react';
import { IWorkspaceRepository } from '../domain/repositories/IWorkspaceRepository';
import { INotebookRepository } from '../domain/repositories/INotebookRepository';
import { ISectionRepository } from '../domain/repositories/ISectionRepository';
import { IPageRepository } from '../domain/repositories/IPageRepository';
import { IAttachmentRepository } from '../domain/repositories/IAttachmentRepository';
import { ITagRepository } from '../domain/repositories/ITagRepository';
import { ISearchRepository } from '../domain/repositories/ISearchRepository';
import { IRevisionRepository } from '../domain/repositories/IRevisionRepository';
import { ITemplateRepository } from '../domain/repositories/ITemplateRepository';

import { LocalWorkspaceRepository } from './repositories/LocalWorkspaceRepository';
import { LocalNotebookRepository } from './repositories/LocalNotebookRepository';
import { LocalSectionRepository } from './repositories/LocalSectionRepository';
import { LocalPageRepository } from './repositories/LocalPageRepository';
import { LocalAttachmentRepository } from './repositories/LocalAttachmentRepository';
import { LocalTagRepository } from './repositories/LocalTagRepository';
import { LocalSearchRepository } from './repositories/LocalSearchRepository';
import { LocalRevisionRepository } from './repositories/LocalRevisionRepository';
import { LocalTemplateRepository } from './repositories/LocalTemplateRepository';

export interface RepositoryContextValue {
  workspaceRepo: IWorkspaceRepository;
  notebookRepo: INotebookRepository;
  sectionRepo: ISectionRepository;
  pageRepo: IPageRepository;
  attachmentRepo: IAttachmentRepository;
  tagRepo: ITagRepository;
  searchRepo: ISearchRepository;
  revisionRepo: IRevisionRepository;
  templateRepo: ITemplateRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repos = useMemo<RepositoryContextValue>(() => ({
    workspaceRepo: new LocalWorkspaceRepository(),
    notebookRepo: new LocalNotebookRepository(),
    sectionRepo: new LocalSectionRepository(),
    pageRepo: new LocalPageRepository(),
    attachmentRepo: new LocalAttachmentRepository(),
    tagRepo: new LocalTagRepository(),
    searchRepo: new LocalSearchRepository(),
    revisionRepo: new LocalRevisionRepository(),
    templateRepo: new LocalTemplateRepository(),
  }), []);

  return (
    <RepositoryContext.Provider value={repos}>
      {children}
    </RepositoryContext.Provider>
  );
};

export function useRepositories(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepositories must be used within RepositoryProvider');
  return ctx;
}

export const useWorkspaceRepo = () => useRepositories().workspaceRepo;
export const useNotebookRepo = () => useRepositories().notebookRepo;
export const useSectionRepo = () => useRepositories().sectionRepo;
export const usePageRepo = () => useRepositories().pageRepo;
export const useAttachmentRepo = () => useRepositories().attachmentRepo;
export const useTagRepo = () => useRepositories().tagRepo;
export const useSearchRepo = () => useRepositories().searchRepo;
export const useRevisionRepo = () => useRepositories().revisionRepo;
export const useTemplateRepo = () => useRepositories().templateRepo;
