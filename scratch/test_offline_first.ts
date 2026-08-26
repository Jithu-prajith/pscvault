import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../server/routes/authRoutes';
import workspaceRoutes from '../server/routes/workspaceRoutes';
import syncRoutes from '../server/routes/syncRoutes';
import entityRoutes from '../server/routes/entityRoutes';

import { LocalWorkspaceRepository } from '../src/infrastructure/repositories/LocalWorkspaceRepository';
import { LocalNotebookRepository } from '../src/infrastructure/repositories/LocalNotebookRepository';
import { LocalSectionRepository } from '../src/infrastructure/repositories/LocalSectionRepository';
import { LocalPageRepository } from '../src/infrastructure/repositories/LocalPageRepository';
import { LocalAttachmentRepository } from '../src/infrastructure/repositories/LocalAttachmentRepository';

const memoryStore: Record<string, string> = {};

function setMockNavigatorOnline(isOnline: boolean) {
  (globalThis as any).window = globalThis;
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: isOnline },
    writable: true,
    configurable: true,
  });
}

function activeLocalStorage(store: Record<string, string>) {
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; }
  };
}

async function runOfflineFirstAcceptanceTest() {
  console.log('====================================================');
  console.log('🧪 PSCVault OFFLINE-FIRST ACCEPTANCE & RESILIENCY TEST');
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

  // 1. Start Server for online phase
  const app = express();
  const PORT = 5097;
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '50mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api', entityRoutes);

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pscvault_test_offline_first';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
  } catch (e) {}

  const server = app.listen(PORT);
  const API_BASE = `http://localhost:${PORT}/api`;
  const { SyncEngine } = await import('../src/infrastructure/sync/SyncEngine');
  SyncEngine.setApiBaseUrl(API_BASE);

  // Initialize Storage & Disconnect Network
  activeLocalStorage(memoryStore);
  setMockNavigatorOnline(false);

  console.log('--- PHASE 1: 100% OFFLINE OPERATIONS (NO INTERNET CONNECTION) ---');

  const userId = 'usr_offline_candidate_2027';
  const wsRepo = new LocalWorkspaceRepository();
  const nbRepo = new LocalNotebookRepository();
  const secRepo = new LocalSectionRepository();
  const pageRepo = new LocalPageRepository();
  const attRepo = new LocalAttachmentRepository();

  // Create Workspace offline
  const ws = await wsRepo.create({ userId, name: 'Offline UPSC Master OS' });
  assert(!!ws.id, 'Create Workspace 100% Offline');

  // Create GS III Notebook offline
  const nb = await nbRepo.create({ workspaceId: ws.id, name: 'GS III — Economy & Sci-Tech', icon: '⚡' });
  assert(!!nb.id, 'Create GS III Notebook 100% Offline');

  // Create Subject Section offline
  const secGrp = await secRepo.createGroup({ notebookId: nb.id, name: 'Science & Technology', position: 'a0' });
  const secSciTech = await secRepo.create({ notebookId: nb.id, sectionGroupId: secGrp.id, name: 'AI, Robotics & Space', color: '#8b5cf6' });
  assert(!!secSciTech.id, 'Create Sci-Tech Subject Section 100% Offline');

  // Create Chapter & Topic offline
  const chap1 = await pageRepo.createChapter(secSciTech.id, 'Emerging Technologies');
  assert(chap1.numbering === '1', 'Create Autonumbered Chapter 1 Offline');

  const topic1 = await pageRepo.createTopic(chap1.id, 'AI & Robotics in Agriculture');
  assert(topic1.numbering === '1.1', 'Create Topic 1.1 AI & Robotics Offline');

  // Write 500 words note offline
  const updatedRes = await pageRepo.updateContent(topic1.id, {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Precision agriculture using drone sensors and autonomous AI harvesters.' }] }]
  });
  const updatedTopic = await pageRepo.getById(topic1.id);
  assert(updatedTopic?.version === 2, 'Update Note Content & Increment Version Offline');

  // Add Image & PDF Attachments offline
  const imgAtt = await attRepo.save({
    workspaceId: ws.id,
    pageId: topic1.id,
    originalFileName: 'Agricultural_Drone_Diagram.png',
    mimeType: 'image/png',
    fileData: new Uint8Array([137, 80, 78, 71]),
    width: 800,
    height: 600,
  });
  assert(!!imgAtt.id, 'Save Image Attachment Offline');

  const pdfAtt = await attRepo.save({
    workspaceId: ws.id,
    pageId: topic1.id,
    originalFileName: 'NITI_Aayog_National_Strategy_AI.pdf',
    mimeType: 'application/pdf',
    fileData: new Uint8Array([37, 80, 68, 70]),
    pageCount: 42,
  });
  assert(!!pdfAtt.id, 'Save PDF Attachment Offline');

  // Soft Delete & Restore Topic offline
  await pageRepo.softDelete(topic1.id);
  const activeAfterDel = await pageRepo.getBySection(secSciTech.id);
  assert(!activeAfterDel.some(p => p.id === topic1.id), 'Soft Delete Topic Offline');

  await pageRepo.restore(topic1.id);
  const activeAfterRestore = await pageRepo.getBySection(secSciTech.id);
  assert(activeAfterRestore.some(p => p.id === topic1.id), 'Restore Topic Offline');

  // Inspect Local SyncQueue
  const queue = SyncEngine.getLocalQueue();
  assert(queue.length > 0, 'Operations Queued in Local SyncQueue', `Pending Ops Count: ${queue.length}`);

  // Inspect Sync Status
  const offlineStatus = SyncEngine.getSyncStatus();
  assert(offlineStatus.status === 'offline' && offlineStatus.pendingOps === queue.length, 'Sync Status Reports Offline & Pending Queue Count');

  console.log('\n--- PHASE 2: APPLICATION REOPEN OFFLINE (LOCAL PERSISTENCE) ---');
  // Re-instantiate repositories to simulate full page refresh while remaining offline
  const pageRepoReloaded = new LocalPageRepository();
  const reloadedTopic1 = await pageRepoReloaded.getById(topic1.id);
  assert(reloadedTopic1?.title.includes('AI & Robotics'), 'Reload App Offline: Topic 1.1 Persisted in SQLite');
  assert((reloadedTopic1?.content as any)?.content[0]?.content[0]?.text.includes('Precision agriculture'), 'Reload App Offline: Note Content Persisted in SQLite');

  const attRepoReloaded = new LocalAttachmentRepository();
  const reloadedAtts = await attRepoReloaded.getByPage(topic1.id);
  assert(reloadedAtts.length === 2, 'Reload App Offline: Image & PDF Attachments Persisted in SQLite');

  console.log('\n--- PHASE 3: INTERNET RECONNECT & AUTOMATIC CLOUD SYNC ---');
  setMockNavigatorOnline(true); // INTERNET RESTORED

  // Register account on backend API to associate cloud session
  const email = 'offline.candidate@pscvault.org';
  const password = 'OfflineMasterPassword2027!';
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'offline-laptop' },
    body: JSON.stringify({ name: 'Offline Candidate', email, password, deviceId: 'offline-laptop' }),
  });
  const regData = await regRes.json();
  localStorage.setItem('pscvault_session', JSON.stringify({ user: regData.user, token: regData.token }));

  // Trigger Automatic Sync Push
  const pushSuccess = await SyncEngine.pushLocalChanges();
  assert(pushSuccess, 'Auto-Reconnect: Process SyncQueue & Push to Cloud Engine');

  const remainingQueue = SyncEngine.getLocalQueue();
  assert(remainingQueue.length === 0, 'SyncQueue Cleared Cleanly After Push');

  const onlineStatus = SyncEngine.getSyncStatus();
  assert(onlineStatus.status === 'synced', 'Sync Status Reports Synced After Reconnect');

  console.log('\n====================================================');
  console.log(`📊 OFFLINE-FIRST TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL 18 OFFLINE-FIRST ACCEPTANCE & RESILIENCY TESTS PASSED 100%!');
    process.exit(0);
  } else {
    console.error('❌ OFFLINE-FIRST ACCEPTANCE TEST FAILED.');
    process.exit(1);
  }
}

runOfflineFirstAcceptanceTest().catch((err) => {
  console.error('Offline test execution error:', err);
  process.exit(1);
});
