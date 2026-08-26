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

// Setup Mock Memory Storage Engine for Node testing environment
const memoryStoreA: Record<string, string> = {};
const memoryStoreB: Record<string, string> = {};

function activeDeviceStorage(store: Record<string, string>) {
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; }
  };
}

async function runMultiDeviceTest() {
  console.log('====================================================');
  console.log('🧪 PSCVault Multi-Device Cloud Sync Automated Test');
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

  // 1. Start Express Server in test mode
  const app = express();
  const PORT = 5099;
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '50mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api', entityRoutes);

  // Connect to MongoDB with 1s timeout fallback
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pscvault_test_multidevice';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    console.log('✅ Connected & Initialized MongoDB Atlas Database\n');
  } catch (e) {
    console.log('💡 Using High-Speed In-Memory Document Engine for Multi-Device Test\n');
  }

  const server = app.listen(PORT);
  console.log(`🚀 Test Backend Server running on http://localhost:${PORT}\n`);

  const API_BASE = `http://localhost:${PORT}/api`;
  const { SyncEngine } = await import('../src/infrastructure/sync/SyncEngine');
  SyncEngine.setApiBaseUrl(API_BASE);

  // ----------------------------------------------------
  // DEVICE A TESTS
  // ----------------------------------------------------
  console.log('--- STEP 1: DEVICE A — REGISTER & LOGIN ---');
  activeDeviceStorage(memoryStoreA);

  const email = 'aspirant.upsc.2027@pscvault.org';
  const password = 'MasterPassword2027!';

  // Register Device A Account
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'desktop-laptop-device-a' },
    body: JSON.stringify({ name: 'Rahul Sharma', email, password, deviceId: 'desktop-laptop-device-a' }),
  });
  const regData = await regRes.json();
  assert(regRes.ok && !!regData.token, 'Register Device A Account', `User ID: ${regData.user?.id}`);

  const tokenA = regData.token;
  localStorage.setItem('pscvault_session', JSON.stringify({ user: regData.user, token: tokenA }));

  console.log('\n--- STEP 2: DEVICE A — CREATE UPSC MASTER NOTEBOOK HIERARCHY ---');
  const wsRepoA = new LocalWorkspaceRepository();
  const nbRepoA = new LocalNotebookRepository();
  const secRepoA = new LocalSectionRepository();
  const pageRepoA = new LocalPageRepository();
  const attRepoA = new LocalAttachmentRepository();

  // Create Workspace
  const wsA = await wsRepoA.create({ userId: regData.user.id, name: 'UPSC CSE 2027 Master OS' });
  assert(!!wsA.id, 'Device A: Create Master Workspace');

  // Create Notebook
  const nbA = await nbRepoA.create({ workspaceId: wsA.id, name: 'General Studies Master Notebook', icon: '📚' });
  assert(!!nbA.id, 'Device A: Create GS Notebook');

  // Create Section Group & Subject Section
  const secGrpA = await secRepoA.createGroup({ notebookId: nbA.id, name: 'GS I — Heritage & History', position: 'a0' });
  const secA = await secRepoA.create({ notebookId: nbA.id, sectionGroupId: secGrpA.id, name: 'History & Art', color: '#6366f1' });
  assert(!!secA.id, 'Device A: Create History Subject Section');

  // Create Chapter & Topics
  const chapA = await pageRepoA.createChapter(secA.id, 'Indus Valley & Ancient Civilizations');
  assert(!!chapA.id && chapA.title.includes('Chapter 1'), 'Device A: Create Autonumbered Chapter 1');

  const topic1A = await pageRepoA.createTopic(chapA.id, 'Indus Valley Civilization');
  assert(!!topic1A.id && topic1A.numbering === '1.1', 'Device A: Create Topic 1.1 Indus Valley');

  // Write 500 words rich-text note & add PDF attachment
  await pageRepoA.updateContent(topic1A.id, {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Detailed study notes on Harappan urban planning, drainage, and trade routes.' }] }]
  });

  const pdfAttA = await attRepoA.save({
    workspaceId: wsA.id,
    pageId: topic1A.id,
    originalFileName: 'Harappan_Archaeology_Map.pdf',
    mimeType: 'application/pdf',
    fileData: new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]),
    pageCount: 15,
  });
  assert(!!pdfAttA.id, 'Device A: Add PDF Attachment');

  // Push Device A changes to Cloud Database
  const pushSuccessA = await SyncEngine.pushLocalChanges();
  assert(pushSuccessA, 'Device A: Push Local Changes to MongoDB Cloud Engine');

  console.log('\n--- STEP 3: DEVICE B — LOGIN SAME ACCOUNT ON NEW DEVICE ---');
  activeDeviceStorage(memoryStoreB);

  // Login Device B
  const loginResB = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'phone-android-device-b' },
    body: JSON.stringify({ email, password, deviceId: 'phone-android-device-b' }),
  });
  const loginDataB = await loginResB.json();
  assert(loginResB.ok && !!loginDataB.token, 'Device B: Login with SAME ACCOUNT');

  const tokenB = loginDataB.token;
  localStorage.setItem('pscvault_session', JSON.stringify({ user: loginDataB.user, token: tokenB }));

  // Execute Initial Sync on New Device
  const syncResB = await SyncEngine.syncOnLogin(tokenB);
  assert(syncResB.hasCloudWorkspace, 'Device B: Retrieve Existing Cloud Workspace on Login (No Blank Workspace)');

  const pageRepoB = new LocalPageRepository();
  const pagesB = await pageRepoB.getBySection(secA.id);
  assert(pagesB.length === 2 && pagesB.some(p => p.id === topic1A.id), 'Device B: Local SQLite Populated with Chapter 1 & Topic 1.1');

  const fullTopic1B = await pageRepoB.getById(topic1A.id);
  assert(fullTopic1B?.title.includes('Indus Valley'), 'Device B: Topic Content & Title Verified');

  console.log('\n--- STEP 4: DEVICE B — EDIT & DELETE ON DEVICE B ---');
  // Create Topic 1.2 on Device B
  const topic2B = await pageRepoB.createTopic(chapA.id, 'Vedic Period & Society');
  assert(!!topic2B.id && topic2B.numbering === '1.2', 'Device B: Create Topic 1.2 Vedic Period');

  // Soft Delete Topic 1.1 on Device B
  await pageRepoB.softDelete(topic1A.id);
  const activeAfterDelB = await pageRepoB.getBySection(secA.id);
  // activeAfterDelB contains Chapter 1 + Topic 1.2 (2 active pages in section)
  assert(activeAfterDelB.length === 2 && activeAfterDelB.some(p => p.id === topic2B.id) && !activeAfterDelB.some(p => p.id === topic1A.id), 'Device B: Soft Delete Topic 1.1');

  // Push Device B changes
  const pushSuccessB = await SyncEngine.pushLocalChanges();
  assert(pushSuccessB, 'Device B: Push Changes (CREATE 1.2 & DELETE 1.1) to Cloud Engine');

  console.log('\n--- STEP 5: DEVICE A — INCREMENTAL SYNC PULL ON DEVICE A ---');
  activeDeviceStorage(memoryStoreA);

  const pullSuccessA = await SyncEngine.pullServerChanges(tokenA, 0);
  assert(pullSuccessA, 'Device A: Incremental Pull Changes from Cloud Engine');

  const pagesAfterPullA = await pageRepoA.getBySection(secA.id);
  assert(pagesAfterPullA.length === 2 && pagesAfterPullA.some(p => p.id === topic2B.id) && !pagesAfterPullA.some(p => p.id === topic1A.id), 'Device A: Topic 1.2 Appears & Topic 1.1 Moved to Trash');

  console.log('\n--- STEP 6: DEVICE A — RESTORE SYNCHRONIZATION ---');
  await pageRepoA.restore(topic1A.id);
  await SyncEngine.pushLocalChanges();

  activeDeviceStorage(memoryStoreB);
  await SyncEngine.pullServerChanges(tokenB, 0);
  const pagesAfterRestoreB = await pageRepoB.getBySection(secA.id);
  assert(pagesAfterRestoreB.length === 3 && pagesAfterRestoreB.some(p => p.id === topic1A.id), 'Device B: Topic 1.1 Reappears after Restore');

  console.log('\n====================================================');
  console.log(`📊 MULTI-DEVICE TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL 18 MULTI-DEVICE DATA SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ MULTI-DEVICE SYNCHRONIZATION TEST FAILED.');
    process.exit(1);
  }
}

runMultiDeviceTest().catch((err) => {
  console.error('Multi-device test error:', err);
  process.exit(1);
});
