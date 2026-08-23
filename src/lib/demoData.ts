import { IWorkspaceRepository } from '../domain/repositories/IWorkspaceRepository';
import { INotebookRepository } from '../domain/repositories/INotebookRepository';
import { ISectionRepository } from '../domain/repositories/ISectionRepository';
import { IPageRepository } from '../domain/repositories/IPageRepository';
import { ITagRepository } from '../domain/repositories/ITagRepository';

export async function seedDemoUPSCWorkspace(
  workspaceRepo: IWorkspaceRepository,
  notebookRepo: INotebookRepository,
  sectionRepo: ISectionRepository,
  pageRepo: IPageRepository,
  tagRepo: ITagRepository,
  userId: string,
  targetYear = '2027',
  stage: 'Prelims' | 'Mains' | 'Interview' | 'Beginner' = 'Mains'
) {
  // 1. Create Workspace
  const ws = await workspaceRepo.create({
    userId,
    name: `UPSC CSE ${targetYear} (${stage})`,
    icon: '🏛️',
  });

  // 2. Default UPSC Tags
  const tagPolity = await tagRepo.create({ workspaceId: ws.id, name: 'Polity', color: '#3b82f6', isSystem: true });
  const tagConstitution = await tagRepo.create({ workspaceId: ws.id, name: 'Constitution', color: '#6366f1', isSystem: true });
  const tagEconomy = await tagRepo.create({ workspaceId: ws.id, name: 'Economy', color: '#10b981', isSystem: true });
  const tagImportant = await tagRepo.create({ workspaceId: ws.id, name: 'Important', color: '#ef4444', isSystem: true });
  const tagPrelims = await tagRepo.create({ workspaceId: ws.id, name: 'PrelimsFact', color: '#f59e0b', isSystem: true });

  // 3. Create Main Notebook
  const nb = await notebookRepo.create({
    workspaceId: ws.id,
    name: `UPSC CSE ${targetYear} Master Notebook`,
    icon: '📚',
    color: '#6366f1',
  });

  let firstSectionId = '';
  let firstPage = null;

  if (stage === 'Prelims') {
    // PRELIMS STAGE HIERARCHY
    const grpPaper1 = await sectionRepo.createGroup(nb.id, 'Paper I — General Studies (Prelims)');
    const secHist = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'History of India & Freedom Movement', color: '#f59e0b' });
    const secArt = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'Art & Culture', color: '#f59e0b' });
    const secGeo = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'Indian & World Geography', color: '#f59e0b' });
    const secPolity = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'Indian Polity & Governance', color: '#3b82f6' });
    const secEcon = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'Economic & Social Development', color: '#10b981' });
    const secEnv = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'Environment & Ecology', color: '#14b8a6' });
    const secSci = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpPaper1.id, name: 'General Science & Tech', color: '#ec4899' });

    const grpCSAT = await sectionRepo.createGroup(nb.id, 'Paper II — CSAT');
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpCSAT.id, name: 'Quantitative Aptitude', color: '#8b5cf6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpCSAT.id, name: 'Reasoning Ability', color: '#8b5cf6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpCSAT.id, name: 'Reading Comprehension', color: '#8b5cf6' });

    await sectionRepo.create({ notebookId: nb.id, name: 'Prelims Current Affairs Digest', color: '#ef4444' });
    await sectionRepo.create({ notebookId: nb.id, name: 'Mock Test Analytics & Error Log', color: '#64748b' });

    firstSectionId = secPolity.id;

    firstPage = await pageRepo.create({
      sectionId: secPolity.id,
      title: 'Constitutional Amendments — High-Yield Prelims Facts',
      icon: '⚡',
      syllabusExam: 'UPSC CSE',
      syllabusStage: 'Prelims',
      syllabusPaper: 'Prelims Paper 1',
      syllabusSubject: 'Polity',
      syllabusTopic: 'Amendments & Articles',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'High-Yield Constitutional Amendments' }] },
          { type: 'callout', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Important for Prelims: 42nd Amendment (Mini Constitution), 44th Amendment (Right to Property), 73rd & 74th Amendments (Local Self Govt), 101st (GST), 103rd (EWS), 104th (SC/ST Reservation), 105th (OBC List), 106th (Nari Shakti Vandan).' }] }] },
        ]
      }
    });

    await tagRepo.assignToPage(firstPage.id, tagPolity.id);
    await tagRepo.assignToPage(firstPage.id, tagPrelims.id);

  } else if (stage === 'Beginner') {
    // BEGINNER / FOUNDATION STAGE HIERARCHY
    const grpNCERT = await sectionRepo.createGroup(nb.id, 'NCERT Foundation');
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpNCERT.id, name: 'History NCERTs (Class 6-12)', color: '#f59e0b' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpNCERT.id, name: 'Geography NCERTs (Class 6-12)', color: '#f59e0b' });
    const secPolNCERT = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpNCERT.id, name: 'Polity NCERTs (Class 6-12)', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpNCERT.id, name: 'Economy NCERTs (Class 9-12)', color: '#10b981' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpNCERT.id, name: 'Science NCERTs (Class 6-10)', color: '#ec4899' });

    const grpGS1 = await sectionRepo.createGroup(nb.id, 'GS I');
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'History', color: '#f59e0b' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'Art & Culture', color: '#f59e0b' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'Geography', color: '#f59e0b' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'Indian Society', color: '#f59e0b' });

    const grpGS2 = await sectionRepo.createGroup(nb.id, 'GS II');
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Polity', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Governance', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Constitution', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'International Relations', color: '#3b82f6' });

    await sectionRepo.create({ notebookId: nb.id, name: 'Daily Newspaper Reading & Vocab', color: '#ef4444' });
    await sectionRepo.create({ notebookId: nb.id, name: 'UPSC Syllabus & PYQ Orientation', color: '#64748b' });

    firstSectionId = secPolNCERT.id;

    firstPage = await pageRepo.create({
      sectionId: secPolNCERT.id,
      title: 'Class 11 NCERT — Indian Constitution at Work Notes',
      icon: '📖',
      syllabusStage: 'Beginner',
      syllabusSubject: 'Polity NCERT',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Indian Constitution at Work — Summary' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Key chapters: Why do we need a Constitution? Rights in the Indian Constitution, Election and Representation, Executive, Legislature, Judiciary, Federalism.' }] }
        ]
      }
    });

  } else if (stage === 'Interview') {
    // INTERVIEW STAGE HIERARCHY
    const grpDAF = await sectionRepo.createGroup(nb.id, 'DAF (Detailed Application Form)');
    const secHome = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpDAF.id, name: 'Home State & District Profile', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpDAF.id, name: 'Educational Background & College', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpDAF.id, name: 'Hobbies & Extra-Curriculars', color: '#3b82f6' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpDAF.id, name: 'Work Experience & Service Preference', color: '#3b82f6' });

    const grpIssues = await sectionRepo.createGroup(nb.id, 'National & Global Issues');
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpIssues.id, name: 'National Polity & Policy Issues', color: '#10b981' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpIssues.id, name: 'Foreign Policy & Geopolitics', color: '#10b981' });
    await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpIssues.id, name: 'Economic Reforms & Budget', color: '#10b981' });

    await sectionRepo.create({ notebookId: nb.id, name: 'Mock Interview Transcripts & Feedback', color: '#ec4899' });

    firstSectionId = secHome.id;

    firstPage = await pageRepo.create({
      sectionId: secHome.id,
      title: 'Home State Profile — High-Yield Questions',
      icon: '🏛️',
      syllabusStage: 'Interview',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'DAF Analysis — Home State Preparation' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Key historical events, major economic sectors, socio-economic challenges, and recent schemes in your state...' }] }
        ]
      }
    });

  } else {
    // MAINS / DEFAULT STAGE HIERARCHY (EXACT MATCH FOR USER REQUIREMENT)
    // GS I Group
    const grpGS1 = await sectionRepo.createGroup(nb.id, 'GS I');
    const secHist = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'History', color: '#f59e0b' });
    const secArt = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'Art & Culture', color: '#f59e0b' });
    const secGeo = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'Geography', color: '#f59e0b' });
    const secSoc = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'Indian Society', color: '#f59e0b' });
    const secWHist = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS1.id, name: 'World History', color: '#f59e0b' });

    // GS II Group
    const grpGS2 = await sectionRepo.createGroup(nb.id, 'GS II');
    const secPol = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Polity', color: '#3b82f6' });
    const secGov = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Governance', color: '#3b82f6' });
    const secConst = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Constitution', color: '#3b82f6' });
    const secSocJust = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'Social Justice', color: '#3b82f6' });
    const secIR = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS2.id, name: 'International Relations', color: '#3b82f6' });

    // GS III Group
    const grpGS3 = await sectionRepo.createGroup(nb.id, 'GS III');
    const secEcon = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS3.id, name: 'Economy', color: '#10b981' });
    const secSci = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS3.id, name: 'Science & Technology', color: '#10b981' });
    const secEnv = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS3.id, name: 'Environment & Ecology', color: '#10b981' });
    const secSec = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS3.id, name: 'Internal Security', color: '#10b981' });
    const secDis = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS3.id, name: 'Disaster Management', color: '#10b981' });

    // GS IV Group
    const grpGS4 = await sectionRepo.createGroup(nb.id, 'GS IV');
    const secEth = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS4.id, name: 'Ethics', color: '#8b5cf6' });
    const secInt = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS4.id, name: 'Integrity', color: '#8b5cf6' });
    const secApt = await sectionRepo.create({ notebookId: nb.id, sectionGroupId: grpGS4.id, name: 'Aptitude', color: '#8b5cf6' });

    // Top-Level Standalone Sections
    await sectionRepo.create({ notebookId: nb.id, name: 'Essay Workspace', color: '#ec4899' });
    await sectionRepo.create({ notebookId: nb.id, name: 'Current Affairs & Editorials', color: '#ef4444' });

    firstSectionId = secConst.id;

    // Sample Pages in Constitution Section
    firstPage = await pageRepo.create({
      sectionId: secConst.id,
      title: 'Basic Structure Doctrine — Kesavananda Bharati & Beyond',
      icon: '📜',
      syllabusExam: 'UPSC CSE',
      syllabusStage: 'Mains',
      syllabusPaper: 'GS2',
      syllabusSubject: 'Constitution',
      syllabusTopic: 'Basic Structure Doctrine & Amendments',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Basic Structure Doctrine' }] },
          {
            type: 'callout',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Core Definition: ' },
                  { type: 'text', text: 'The Basic Structure Doctrine is a judicial principle established by the Supreme Court of India in the landmark Kesavananda Bharati v. State of Kerala (1973) case, holding that Parliament’s amending power under Article 368 cannot alter or destroy the basic features of the Constitution.' }
                ]
              }
            ]
          },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Evolution of the Doctrine' }] },
          {
            type: 'bulletList',
            content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Shankari Prasad Case (1951): ' }, { type: 'text', text: 'SC held Parliament can amend any part including Fundamental Rights.' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Golaknath Case (1967): ' }, { type: 'text', text: 'SC reversed stance, declaring Fundamental Rights are sacrosanct.' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kesavananda Bharati Case (1973): ' }, { type: 'text', text: '7:6 majority benchmark ruling established the Basic Structure concept.' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Minerva Mills Case (1980): ' }, { type: 'text', text: 'Reaffirmed judicial review and balance between Part III and Part IV as basic features.' }] }] }
            ]
          },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. Key Components of Basic Structure' }] },
          {
            type: 'table',
            content: [
              { type: 'tableRow', content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Basic Feature' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Judicial Authority / Case' }] }] }
              ]},
              { type: 'tableRow', content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Supremacy of Constitution & Secularism' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'S.R. Bommai v. Union of India (1994)' }] }] }
              ]},
              { type: 'tableRow', content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Judicial Review (Art 32, 226)' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'L. Chandra Kumar v. Union of India (1997)' }] }] }
              ]},
              { type: 'tableRow', content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Free & Fair Elections' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Indira Nehru Gandhi v. Raj Narain (1975)' }] }] }
              ]}
            ]
          },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '3. Mains Question Angle' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Does the Basic Structure Doctrine strike a balance between constitutional continuity and judicial overreach?" Discuss with reference to recent judgments.' }] }
        ]
      }
    });

    await pageRepo.toggleFavorite(firstPage.id);
    await tagRepo.assignToPage(firstPage.id, tagPolity.id);
    await tagRepo.assignToPage(firstPage.id, tagConstitution.id);
    await tagRepo.assignToPage(firstPage.id, tagImportant.id);

    // Sample Page in Polity Section
    const page2 = await pageRepo.create({
      sectionId: secPol.id,
      title: 'Cooperative Federalism vs Competitive Federalism',
      icon: '⚖️',
      syllabusPaper: 'GS2',
      syllabusSubject: 'Polity',
      syllabusTopic: 'Federal Structure & Devolution',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Federal Dynamics in India' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Notes on NITI Aayog Aspirational Districts Programme, Inter-State Council under Article 263, and GST Council dynamics...' }] }
        ]
      }
    });

    await tagRepo.assignToPage(page2.id, tagPolity.id);

    // Sample Page in Environment Section
    const page3 = await pageRepo.create({
      sectionId: secEnv.id,
      title: 'Climate Change & COP Summits — India’s Panchamrit Commitments',
      icon: '🌿',
      syllabusPaper: 'GS3',
      syllabusSubject: 'Environment & Ecology',
      syllabusTopic: 'Conservation & Climate Summits',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'India at COP26 & Beyond' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Net Zero by 2070' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '500 GW Non-Fossil Energy Capacity by 2030' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '50% Energy requirements from Renewable Energy by 2030' }] }] }
          ]}
        ]
      }
    });

    await tagRepo.assignToPage(page3.id, tagEconomy.id);
  }

  return { workspace: ws, notebook: nb, sectionId: firstSectionId, page: firstPage };
}
