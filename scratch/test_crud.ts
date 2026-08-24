import { LocalWorkspaceRepository } from '../src/infrastructure/repositories/LocalWorkspaceRepository';
import { LocalNotebookRepository } from '../src/infrastructure/repositories/LocalNotebookRepository';
import { LocalSectionRepository } from '../src/infrastructure/repositories/LocalSectionRepository';
import { LocalPageRepository } from '../src/infrastructure/repositories/LocalPageRepository';
import { LocalAttachmentRepository } from '../src/infrastructure/repositories/LocalAttachmentRepository';
import { LocalTagRepository } from '../src/infrastructure/repositories/LocalTagRepository';

// Setup Mock LocalStorage for Node testing environment
const memoryStore: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStore[key] || null,
  setItem: (key: string, val: string) => { memoryStore[key] = val; },
  removeItem: (key: string) => { delete memoryStore[key]; },
  clear: () => { for (const k in memoryStore) delete memoryStore[k]; }
};

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 PSCVault Automated Software Test Suite');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASSED: ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`  ❌ FAILED: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  const workspaceRepo = new LocalWorkspaceRepository();
  const notebookRepo = new LocalNotebookRepository();
  const sectionRepo = new LocalSectionRepository();
  const pageRepo = new LocalPageRepository();
  const attachmentRepo = new LocalAttachmentRepository();
  const tagRepo = new LocalTagRepository();

  console.log('--- TEST GROUP 1: WORKSPACE CRUD ---');
  const userId = 'usr_test_aspirant';
  
  // 1. Create Workspace
  const ws = await workspaceRepo.create({
    userId,
    name: 'UPSC CSE 2027 Workspace',
    description: 'Main prep workspace'
  });
  assert(!!ws.id && ws.name === 'UPSC CSE 2027 Workspace', 'Create Workspace', `ID: ${ws.id}`);

  // 2. Read Workspace
  const fetchedWs = await workspaceRepo.getById(ws.id);
  assert(fetchedWs?.id === ws.id && fetchedWs?.name === 'UPSC CSE 2027 Workspace', 'Read Workspace by ID');

  const allWs = await workspaceRepo.getAll(userId);
  assert(allWs.length === 1 && allWs[0].id === ws.id, 'Read All Workspaces for User');

  // 3. Update Workspace
  const updatedWs = await workspaceRepo.update(ws.id, { name: 'UPSC CSE 2027 Master OS' });
  assert(updatedWs.name === 'UPSC CSE 2027 Master OS', 'Update Workspace Name');

  console.log('\n--- TEST GROUP 2: NOTEBOOK & SECTION CRUD ---');
  // 1. Create Notebook
  const nb = await notebookRepo.create({
    workspaceId: ws.id,
    name: 'General Studies Master Notebook',
    icon: '📚'
  });
  assert(!!nb.id && nb.name === 'General Studies Master Notebook', 'Create Notebook', `ID: ${nb.id}`);

  // 2. Create Section Group
  const secGrp = await sectionRepo.createGroup({
    notebookId: nb.id,
    name: 'GS I — Heritage, History, Geography & Society',
    position: 'a0'
  });
  assert(!!secGrp.id && secGrp.name.includes('GS I'), 'Create Section Group (GS I)');

  // 3. Create Section
  const sec = await sectionRepo.create({
    notebookId: nb.id,
    sectionGroupId: secGrp.id,
    name: 'Indian Polity & Constitution',
    color: '#6366f1'
  });
  assert(!!sec.id && sec.name === 'Indian Polity & Constitution', 'Create Subject Section');

  const secs = await sectionRepo.getByNotebook(nb.id);
  assert(secs.length === 1 && secs[0].id === sec.id, 'Read Sections by Notebook');

  console.log('\n--- TEST GROUP 3: CHAPTER & TOPIC HIERARCHY CRUD ---');
  // 1. Create Chapter
  const chap = await pageRepo.createChapter(sec.id, 'Fundamental Rights & Duties');
  assert(chap.type === 'chapter' && chap.numbering === '1' && chap.title.includes('Chapter 1'), 'Create Chapter with Autonumbering', `Title: ${chap.title}`);

  // 2. Create Topic under Chapter
  const topic1 = await pageRepo.createTopic(chap.id, 'Article 14 — Equality before Law');
  assert(topic1.type === 'topic' && topic1.parentId === chap.id, 'Create Topic 1.1 under Chapter 1', `Title: ${topic1.title}`);

  const topic2 = await pageRepo.createTopic(chap.id, 'Article 19 — Freedom of Speech');
  assert(topic2.type === 'topic' && topic2.parentId === chap.id, 'Create Topic 1.2 under Chapter 1', `Title: ${topic2.title}`);

  // 3. Read Pages by Section
  const pagesInSec = await pageRepo.getBySection(sec.id);
  assert(pagesInSec.length === 3, 'Read Pages by Section (1 Chapter + 2 Topics)');

  // 4. Read Subpages
  const subpages = await pageRepo.getSubpages(chap.id);
  assert(subpages.length === 2 && subpages.some(p => p.id === topic1.id) && subpages.some(p => p.id === topic2.id), 'Read Subpages under Chapter');

  // 5. Update Topic Content
  const updatedTopic = await pageRepo.update(topic1.id, {
    title: 'Article 14 — Right to Equality (Updated)',
    syllabusPaper: 'GS2',
    syllabusSubject: 'Polity',
    syllabusTopic: 'Fundamental Rights'
  });
  assert(updatedTopic.title.includes('Updated') && updatedTopic.syllabusPaper === 'GS2', 'Update Topic Metadata');

  const updateContentRes = await pageRepo.updateContent(topic1.id, {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes on Equality before Law and Equal Protection of Laws.' }] }]
  });
  assert(updateContentRes.version >= 1, 'Update Rich Text Editor Content & Increment Version');

  console.log('\n--- TEST GROUP 4: TRASH, SOFT DELETE, RESTORE & PERMANENT DELETE ---');
  // 1. Soft Delete Topic 1.2
  await pageRepo.softDelete(topic2.id);
  const activeAfterDel = await pageRepo.getBySection(sec.id);
  assert(activeAfterDel.length === 2 && !activeAfterDel.some(p => p.id === topic2.id), 'Soft Delete Topic (Excluded from active list)');

  const deletedPages = await pageRepo.getDeleted(ws.id);
  assert(deletedPages.some(p => p.id === topic2.id), 'Read Deleted Items in Trash');

  // 2. Restore Topic 1.2
  await pageRepo.restore(topic2.id);
  const activeAfterRestore = await pageRepo.getBySection(sec.id);
  assert(activeAfterRestore.length === 3 && activeAfterRestore.some(p => p.id === topic2.id), 'Restore Topic from Trash');

  // 3. Cascade Soft Delete Chapter
  await pageRepo.softDelete(chap.id);
  const activeAfterChapDel = await pageRepo.getBySection(sec.id);
  assert(activeAfterChapDel.length === 0, 'Cascade Soft Delete Chapter (Soft deletes chapter and child topics)');

  const deletedWithChildren = await pageRepo.getDeleted(ws.id);
  assert(deletedWithChildren.length === 3, 'Trash contains Chapter and both Child Topics');

  // 4. Restore Chapter
  await pageRepo.restore(chap.id);
  const activeAfterChapRestore = await pageRepo.getBySection(sec.id);
  assert(activeAfterChapRestore.length === 3, 'Cascade Restore Chapter (Restores chapter and child topics)');

  // 5. Permanent Delete Single Item
  await pageRepo.permanentDelete(topic2.id);
  const pagesAfterPermanent = await pageRepo.getBySection(sec.id);
  assert(pagesAfterPermanent.length === 2 && !pagesAfterPermanent.some(p => p.id === topic2.id), 'Permanent Delete Single Item');

  console.log('\n--- TEST GROUP 5: ATTACHMENTS & TAGS CRUD ---');
  // 1. Attachment Save
  const dummyBuffer = new Uint8Array([70, 73, 76, 69]); // 'FILE'
  const att = await attachmentRepo.save({
    workspaceId: ws.id,
    pageId: topic1.id,
    originalFileName: 'Constitution_Article14_Judgments.pdf',
    mimeType: 'application/pdf',
    fileData: dummyBuffer,
    pageCount: 12
  });
  assert(!!att.id && att.mediaType === 'pdf' && att.originalFileName === 'Constitution_Article14_Judgments.pdf', 'Create PDF Attachment Record');

  const pageAtts = await attachmentRepo.getByPage(topic1.id);
  assert(pageAtts.length === 1 && pageAtts[0].id === att.id, 'Read Page Attachments');

  // 2. Attachment Soft Delete & Restore
  await attachmentRepo.softDelete(att.id);
  const attsAfterSoftDel = await attachmentRepo.getByPage(topic1.id);
  assert(attsAfterSoftDel.length === 0, 'Soft Delete Attachment');

  const delAtts = await attachmentRepo.getDeleted(ws.id);
  assert(delAtts.length === 1 && delAtts[0].id === att.id, 'Read Deleted Attachments in Trash');

  await attachmentRepo.restore(att.id);
  const attsAfterRestore = await attachmentRepo.getByPage(topic1.id);
  assert(attsAfterRestore.length === 1, 'Restore Attachment from Trash');

  // 3. Tag Creation & Assignment
  const tag = await tagRepo.create({
    workspaceId: ws.id,
    name: 'HighPriority',
    color: '#ef4444'
  });
  assert(!!tag.id && tag.name === 'HighPriority', 'Create Tag');

  await tagRepo.assignToPage(topic1.id, tag.id);
  const pageTags = await tagRepo.getPageTags(topic1.id);
  assert(pageTags.length === 1 && pageTags[0].id === tag.id, 'Assign Tag to Page & Read Page Tags');

  await tagRepo.removeFromPage(topic1.id, tag.id);
  const pageTagsAfterRemove = await tagRepo.getPageTags(topic1.id);
  assert(pageTagsAfterRemove.length === 0, 'Remove Tag from Page');

  console.log('\n--- TEST GROUP 6: PERSISTENCE & STORAGE RELOAD VERIFICATION ---');
  // Re-instantiate new repository instances reading from the same memoryStore (simulating page reload)
  const reloadedPageRepo = new LocalPageRepository();
  const reloadedWorkspaceRepo = new LocalWorkspaceRepository();

  const reloadedWsList = await reloadedWorkspaceRepo.getAll(userId);
  assert(reloadedWsList.length === 1 && reloadedWsList[0].name === 'UPSC CSE 2027 Master OS', 'Persisted Workspace Name after Reload');

  const reloadedPages = await reloadedPageRepo.getBySection(sec.id);
  assert(reloadedPages.length === 2, 'Persisted Active Pages Count after Reload');

  const reloadedTopic = await reloadedPageRepo.getById(topic1.id);
  console.log('DEBUG reloadedTopic:', reloadedTopic);
  assert(reloadedTopic?.title.includes('Updated') && reloadedTopic?.version >= 1, 'Persisted Updated Topic Content & Version after Reload');

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL CRUD OPERATIONS EXECUTED SUCCESSFULLY WITH 100% PASS RATE!');
  } else {
    console.error('❌ SOME TESTS FAILED. CHECK LOGS ABOVE.');
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
