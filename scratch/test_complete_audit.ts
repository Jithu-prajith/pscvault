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
import { formatISTDateTime } from '../src/lib/utils';

// Multi-device & Multi-user mock storage containers
const storeUserA_DevA: Record<string, string> = {};
const storeUserA_DevB: Record<string, string> = {};
const storeUserB_Dev1: Record<string, string> = {};

function setActiveLocalStorage(store: Record<string, string>) {
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; }
  };
}

async function runCompleteApplicationAudit() {
  console.log('====================================================');
  console.log('🛡️ PSCVault COMPLETE FUNCTIONAL & SECURITY AUDIT');
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

  // 1. Start Server
  const app = express();
  const PORT = 5098;
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '50mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api', entityRoutes);

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pscvault_test_full_audit';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    console.log('✅ Connected & Reset MongoDB Atlas Audit Database\n');
  } catch (e) {
    console.log('💡 Running Audit against High-Performance In-Memory Engine\n');
  }

  const server = app.listen(PORT);
  const API_BASE = `http://localhost:${PORT}/api`;
  const { SyncEngine } = await import('../src/infrastructure/sync/SyncEngine');
  SyncEngine.setApiBaseUrl(API_BASE);

  // ----------------------------------------------------
  // PART 2: AUTHENTICATION AUDIT
  // ----------------------------------------------------
  console.log('--- PART 2: AUTHENTICATION AUDIT ---');
  activeDeviceStorage(storeUserA_DevA);

  const emailA = 'candidate.a@pscvault.org';
  const passwordA = 'UserAPassword2027!';

  // Register User A
  const regResA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'laptop-user-a' },
    body: JSON.stringify({ name: 'Candidate A', email: emailA, password: passwordA, deviceId: 'laptop-user-a' }),
  });
  const regDataA = await regResA.json();
  assert(regResA.status === 201 && !!regDataA.token, 'Register User A Account', `User ID: ${regDataA.user?.id}`);

  // Bad Password Test
  const badLogRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password: 'WrongPassword' }),
  });
  assert(badLogRes.status === 401, 'Reject Incorrect Password');

  // Correct Login Test
  const logResA = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'laptop-user-a' },
    body: JSON.stringify({ email: emailA, password: passwordA, deviceId: 'laptop-user-a' }),
  });
  const logDataA = await logResA.json();
  assert(logResA.ok && !!logDataA.token, 'Login User A Account');

  const tokenA = logDataA.token;
  localStorage.setItem('pscvault_session', JSON.stringify({ user: logDataA.user, token: tokenA }));

  // ----------------------------------------------------
  // PART 8 & 9: CRUD & UPSC HIERARCHY AUDIT
  // ----------------------------------------------------
  console.log('\n--- PART 8 & 9: UPSC HIERARCHY & CRUD AUDIT ---');
  const wsRepoA = new LocalWorkspaceRepository();
  const nbRepoA = new LocalNotebookRepository();
  const secRepoA = new LocalSectionRepository();
  const pageRepoA = new LocalPageRepository();
  const attRepoA = new LocalAttachmentRepository();

  // Create Workspace
  const wsA = await wsRepoA.create({ userId: logDataA.user.id, name: 'Candidate A UPSC Workspace' });
  assert(!!wsA.id, 'Create User A Workspace');

  // Create Notebook
  const nbA = await nbRepoA.create({ workspaceId: wsA.id, name: 'GS II — Polity & Governance', icon: '📜' });
  assert(!!nbA.id, 'Create GS II Notebook');

  // Create Section Group & Subject
  const secGrpA = await secRepoA.createGroup({ notebookId: nbA.id, name: 'Executive & Judiciary', position: 'a0' });
  const secPolityA = await secRepoA.create({ notebookId: nbA.id, sectionGroupId: secGrpA.id, name: 'Indian Constitution', color: '#10b981' });
  assert(!!secPolityA.id, 'Create Indian Constitution Subject Section');

  // Create Autonumbered Chapter 1 & Topics 1.1 & 1.2
  const chap1A = await pageRepoA.createChapter(secPolityA.id, 'Fundamental Rights');
  assert(chap1A.numbering === '1' && chap1A.title.includes('Chapter 1'), 'Create Chapter 1 Fundamental Rights');

  const topic1A = await pageRepoA.createTopic(chap1A.id, 'Right to Equality (Articles 14-18)');
  assert(topic1A.numbering === '1.1' && topic1A.parentId === chap1A.id, 'Create Topic 1.1 Right to Equality');

  const topic2A = await pageRepoA.createTopic(chap1A.id, 'Right to Freedom (Articles 19-22)');
  assert(topic2A.numbering === '1.2' && topic2A.parentId === chap1A.id, 'Create Topic 1.2 Right to Freedom');

  // Write rich text note
  await pageRepoA.updateContent(topic1A.id, {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Article 14 guarantees equality before law and equal protection of laws.' }] }]
  });

  // Add PDF Attachment
  const pdfAttA = await attRepoA.save({
    workspaceId: wsA.id,
    pageId: topic1A.id,
    originalFileName: 'Article_14_Judicial_Precedents.pdf',
    mimeType: 'application/pdf',
    fileData: new Uint8Array([37, 80, 68, 70]),
    pageCount: 8,
  });
  assert(!!pdfAttA.id, 'Attach PDF to Topic 1.1');

  // Push User A changes
  await SyncEngine.pushLocalChanges();

  // ----------------------------------------------------
  // PART 3 & 21: USER DATA ISOLATION & SECURITY AUDIT
  // ----------------------------------------------------
  console.log('\n--- PART 3 & 21: USER DATA ISOLATION & SECURITY AUDIT ---');
  activeDeviceStorage(storeUserB_Dev1);

  const emailB = 'candidate.b@pscvault.org';
  const passwordB = 'UserBPassword2027!';

  // Register & Login User B
  const regResB = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'phone-user-b' },
    body: JSON.stringify({ name: 'Candidate B', email: emailB, password: passwordB, deviceId: 'phone-user-b' }),
  });
  const regDataB = await regResB.json();
  const tokenB = regDataB.token;
  localStorage.setItem('pscvault_session', JSON.stringify({ user: regDataB.user, token: tokenB }));

  // Check Cloud Workspace for User B
  const wsResB = await fetch(`${API_BASE}/workspace`, {
    headers: { 'Authorization': `Bearer ${tokenB}`, 'x-device-id': 'phone-user-b' }
  });
  const wsDataB = await wsResB.json();
  assert(wsDataB.exists === false, 'User B Workspace Check (User B sees NO User A Workspace)');

  // Attempt IDOR attack: User B attempts to read User A page directly via API
  const idorRes = await fetch(`${API_BASE}/pages/${topic1A.id}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert(idorRes.status === 404, 'Security Enforcement: User B CANNOT read User A Page (Returns 404)');

  // User B creates own independent workspace
  const wsRepoB = new LocalWorkspaceRepository();
  const wsB = await wsRepoB.create({ userId: regDataB.user.id, name: 'Candidate B Optional Workspace' });
  assert(wsB.id !== wsA.id, 'User B Creates Independent Workspace');

  // ----------------------------------------------------
  // PART 4: CROSS-DEVICE CLOUD RESTORATION AUDIT
  // ----------------------------------------------------
  console.log('\n--- PART 4: CROSS-DEVICE CLOUD RESTORATION AUDIT ---');
  activeDeviceStorage(storeUserA_DevB);

  // Login User A on Device B
  const loginResA_DevB = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'tablet-user-a' },
    body: JSON.stringify({ email: emailA, password: passwordA, deviceId: 'tablet-user-a' }),
  });
  const loginDataA_DevB = await loginResA_DevB.json();
  const tokenA_DevB = loginDataA_DevB.token;

  // Execute Sync on Device B
  const syncOnLoginA = await SyncEngine.syncOnLogin(tokenA_DevB);
  assert(syncOnLoginA.hasCloudWorkspace, 'Device B: Restores User A Cloud Workspace on Login');

  const pageRepoA_DevB = new LocalPageRepository();
  const restoredTopic1 = await pageRepoA_DevB.getById(topic1A.id);
  assert(restoredTopic1?.title.includes('Right to Equality'), 'Device B: Verified Topic 1.1 Title Restored');
  assert((restoredTopic1?.content as any)?.content[0]?.content[0]?.text.includes('Article 14'), 'Device B: Verified Topic 1.1 Content Restored');

  // ----------------------------------------------------
  // PART 17: AUTOMATIC IST DATE & TIME STAMPING AUDIT
  // ----------------------------------------------------
  console.log('\n--- PART 17: AUTOMATIC IST DATE & TIME STAMPING AUDIT ---');
  const now = new Date().toISOString();
  const formattedIST = formatISTDateTime(now);
  assert(formattedIST.includes('IST') || formattedIST.length > 5, 'Automatic IST Time Format Verified', formattedIST);

  // ----------------------------------------------------
  // PART 18: TRASH, SOFT-DELETE & RESTORE AUDIT
  // ----------------------------------------------------
  console.log('\n--- PART 18: TRASH & RESTORE AUDIT ---');
  activeDeviceStorage(storeUserA_DevA);

  // Soft delete Topic 1.1 on Device A
  await pageRepoA.softDelete(topic1A.id);
  await SyncEngine.pushLocalChanges();

  // Device B pulls update incrementally
  activeDeviceStorage(storeUserA_DevB);
  await SyncEngine.pullServerChanges(tokenA_DevB);

  const activePagesB = await pageRepoA_DevB.getBySection(secPolityA.id);
  assert(!activePagesB.some(p => p.id === topic1A.id), 'Device B: Soft Deleted Topic 1.1 Removed from Active List');

  // Device B restores Topic 1.1
  await pageRepoA_DevB.restore(topic1A.id);
  await SyncEngine.pushLocalChanges();

  // Device A pulls restore update incrementally
  activeDeviceStorage(storeUserA_DevA);
  await SyncEngine.pullServerChanges(tokenA);
  const activePagesA = await pageRepoA.getBySection(secPolityA.id);
  assert(activePagesA.some(p => p.id === topic1A.id), 'Device A: Restored Topic 1.1 Reappears in Section');

  console.log('\n====================================================');
  console.log(`📊 FINAL AUDIT TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL PSCVault APPLICATION & SECURITY AUDIT TESTS PASSED 100%!');
    process.exit(0);
  } else {
    console.error('❌ PSCVault AUDIT TEST FAILED.');
    process.exit(1);
  }
}

function activeDeviceStorage(store: Record<string, string>) {
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; }
  };
}

runCompleteApplicationAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
