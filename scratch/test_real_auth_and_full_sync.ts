import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import authRoutes from '../server/routes/authRoutes';
import workspaceRoutes from '../server/routes/workspaceRoutes';
import syncRoutes from '../server/routes/syncRoutes';
import entityRoutes from '../server/routes/entityRoutes';
import { JWT_SECRET } from '../server/middleware/authMiddleware';

import { LocalWorkspaceRepository } from '../src/infrastructure/repositories/LocalWorkspaceRepository';
import { LocalNotebookRepository } from '../src/infrastructure/repositories/LocalNotebookRepository';
import { LocalSectionRepository } from '../src/infrastructure/repositories/LocalSectionRepository';
import { LocalPageRepository } from '../src/infrastructure/repositories/LocalPageRepository';
import { LocalAttachmentRepository } from '../src/infrastructure/repositories/LocalAttachmentRepository';
import { getDBClient } from '../src/infrastructure/db/client';

const storeA: Record<string, string> = {};
const storeB: Record<string, string> = {};

function setActiveLocalStorage(store: Record<string, string>) {
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; }
  };
}

async function runRealAuthAndFullSyncTest() {
  console.log('====================================================');
  console.log('🧪 PSCVault REAL BACKEND AUTH & FULL SYNC PULL TEST');
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

  // ----------------------------------------------------
  // TEST PART 1: FALLBACK DB REGEX UNIT TEST
  // ----------------------------------------------------
  console.log('--- PART 1: FALLBACK DB REGEX UNIT TEST ---');
  setActiveLocalStorage(storeA);
  const dbClient = await getDBClient();

  // Test 1a: INSERT OR REPLACE INTO statement
  const resReplace = await dbClient.execute(
    'INSERT OR REPLACE INTO "workspaces" ("id", "user_id", "name", "slug", "position", "version", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['ws_test_replace', 'usr_regex', 'Regex Test Workspace', 'regex-test', 'a0', 1, new Date().toISOString(), new Date().toISOString()]
  );
  assert(resReplace.rowsAffected === 1, 'LocalStorageFallbackDB: INSERT OR REPLACE INTO returns rowsAffected: 1');

  const selectedReplace = await dbClient.select<any[]>('SELECT * FROM "workspaces" WHERE "id" = $1', ['ws_test_replace']);
  assert(selectedReplace.length === 1 && selectedReplace[0].name === 'Regex Test Workspace', 'LocalStorageFallbackDB: Row inserted with INSERT OR REPLACE is retrievable via select()');

  // Test 1b: INSERT OR IGNORE INTO statement (duplicate id should be ignored)
  const resIgnoreDuplicate = await dbClient.execute(
    'INSERT OR IGNORE INTO "workspaces" ("id", "user_id", "name", "slug", "position", "version", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['ws_test_replace', 'usr_regex', 'Duplicate Ignore Name', 'duplicate-slug', 'a0', 1, new Date().toISOString(), new Date().toISOString()]
  );
  assert(resIgnoreDuplicate.rowsAffected === 0, 'LocalStorageFallbackDB: INSERT OR IGNORE INTO skips existing row (rowsAffected: 0)');

  const selectedAfterIgnore = await dbClient.select<any[]>('SELECT * FROM "workspaces" WHERE "id" = $1', ['ws_test_replace']);
  assert(selectedAfterIgnore[0].name === 'Regex Test Workspace', 'LocalStorageFallbackDB: Existing row preserved without overwrite on INSERT OR IGNORE');

  // ----------------------------------------------------
  // TEST PART 2: REAL BACKEND AUTHENTICATION TEST
  // ----------------------------------------------------
  console.log('\n--- PART 2: REAL BACKEND AUTHENTICATION TEST ---');
  const app = express();
  const PORT = 5096;
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '50mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api', entityRoutes);

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pscvault_test_real_auth';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
  } catch (e) {}

  const server = app.listen(PORT);
  const API_BASE = `http://localhost:${PORT}/api`;
  const { SyncEngine } = await import('../src/infrastructure/sync/SyncEngine');
  const { useAuthStore } = await import('../src/stores/authStore');

  // Verify production Render URL construction without /api duplication
  SyncEngine.setApiBaseUrl('https://pscvault-api.onrender.com');
  assert(
    SyncEngine.buildUrl('/api/auth/register') === 'https://pscvault-api.onrender.com/api/auth/register',
    'URL Builder: POST ${VITE_API_URL}/api/auth/register formatted correctly'
  );
  assert(
    SyncEngine.buildUrl('/auth/register') === 'https://pscvault-api.onrender.com/api/auth/register',
    'URL Builder: /auth/register automatically prefixed with /api'
  );
  assert(
    SyncEngine.buildUrl('/api/auth/login') === 'https://pscvault-api.onrender.com/api/auth/login',
    'URL Builder: POST ${VITE_API_URL}/api/auth/login formatted correctly'
  );
  assert(
    SyncEngine.buildUrl('/api/auth/logout') === 'https://pscvault-api.onrender.com/api/auth/logout',
    'URL Builder: POST ${VITE_API_URL}/api/auth/logout formatted correctly'
  );
  assert(
    SyncEngine.buildUrl('/api/auth/refresh') === 'https://pscvault-api.onrender.com/api/auth/refresh',
    'URL Builder: POST ${VITE_API_URL}/api/auth/refresh formatted correctly'
  );
  assert(
    SyncEngine.buildUrl('/api/auth/me') === 'https://pscvault-api.onrender.com/api/auth/me',
    'URL Builder: GET ${VITE_API_URL}/api/auth/me formatted correctly'
  );

  // Verify when VITE_API_URL already contains trailing /api or slash
  SyncEngine.setApiBaseUrl('https://pscvault-api.onrender.com/api/');
  assert(
    SyncEngine.buildUrl('/api/auth/register') === 'https://pscvault-api.onrender.com/api/auth/register',
    'URL Builder: No duplicate /api/api when env URL has /api/'
  );

  // Set to local test server
  SyncEngine.setApiBaseUrl(API_BASE);

  const name = 'Real Candidate';
  const email = 'real.candidate@pscvault.org';
  const password = 'RealJWTSecretPassword2027!';

  // Register User Account via frontend useAuthStore.register()
  const regResult = await useAuthStore.getState().register(name, email, password);
  const registeredToken = useAuthStore.getState().token;
  assert(regResult.success && !!registeredToken, 'Register Account via useAuthStore.register() calls /api/auth/register');

  // Confirm returned token verifies with jwt.verify(token, JWT_SECRET)
  let decoded: any = null;
  try {
    decoded = jwt.verify(registeredToken!, JWT_SECRET);
  } catch (e) {}
  assert(!!decoded && decoded.userId === useAuthStore.getState().user?.id, 'Register Returns Valid JWT Token Signed with JWT_SECRET');

  // Reject Bad Password via useAuthStore.login()
  const badLogResult = await useAuthStore.getState().login(email, 'WrongPassword!');
  assert(!badLogResult.success, 'Reject Invalid Password (HTTP 401)');

  // Login Account via useAuthStore.login()
  const logResult = await useAuthStore.getState().login(email, password);
  const logToken = useAuthStore.getState().token;
  assert(logResult.success && !!logToken, 'Login Account via useAuthStore.login() calls /api/auth/login');

  const tokenA = logToken!;
  const userA = useAuthStore.getState().user;
  localStorage.setItem('pscvault_session', JSON.stringify({ user: userA, token: tokenA }));

  // ----------------------------------------------------
  // TEST PART 3: MULTI-ENTITY SYNC PUSH & PULL TEST
  // ----------------------------------------------------
  console.log('\n--- PART 3: MULTI-ENTITY SYNC PUSH & PULL TEST ---');

  const wsRepoA = new LocalWorkspaceRepository();
  const nbRepoA = new LocalNotebookRepository();
  const secRepoA = new LocalSectionRepository();
  const pageRepoA = new LocalPageRepository();
  const attRepoA = new LocalAttachmentRepository();

  // Device A creates Workspace, Notebook, Group, Section, Page, Attachment, Tag
  const wsA = await wsRepoA.create({ userId: userA!.id, name: 'Candidate Master Workspace' });
  const nbA = await nbRepoA.create({ workspaceId: wsA.id, name: 'GS I — Art & Culture', icon: '🎨' });
  const grpA = await secRepoA.createGroup({ notebookId: nbA.id, name: 'Architecture & Literature', position: 'a0' });
  const secA = await secRepoA.create({ notebookId: nbA.id, sectionGroupId: grpA.id, name: 'Temple Architecture', color: '#ec4899' });
  const chapA = await pageRepoA.createChapter(secA.id, 'Dravida Architecture');
  const topicA = await pageRepoA.createTopic(chapA.id, 'Dravida Style Temples of Cholas');

  const attA = await attRepoA.save({
    workspaceId: wsA.id,
    pageId: topicA.id,
    originalFileName: 'Brihadisvara_Temple_Thanjavur.jpg',
    mimeType: 'image/jpeg',
    fileData: new Uint8Array([255, 216, 255, 224]),
  });

  // Enqueue a Tag entity
  SyncEngine.enqueueOperation({
    operation: 'CREATE',
    entityType: 'TAG',
    entityId: 'tag_temple_art',
    data: {
      id: 'tag_temple_art',
      workspaceId: wsA.id,
      name: 'Architecture',
      color: '#f59e0b',
      isSystem: 0,
      createdAt: new Date().toISOString(),
    }
  });

  // Push Device A mutations
  const pushOk = await SyncEngine.pushLocalChanges();
  assert(pushOk, 'Device A: Push All 7 Entity Types (Workspace, Notebook, Group, Section, Page, Attachment, Tag)');

  // Device B (fresh local DB, same account, different deviceId)
  setActiveLocalStorage(storeB);
  (global as any).localStorage.setItem('pscvault_device_id', 'phone-dev-b');
  (global as any).localStorage.setItem('pscvault_session', JSON.stringify({ user: userA, token: tokenA }));

  // Pull server changes on Device B
  const pullOk = await SyncEngine.pullServerChanges(tokenA, 0);
  assert(pullOk, 'Device B: pullServerChanges() succeeds with Status 200');

  // Verify all seven rows exist in Device B's local tables
  const dbB = await getDBClient();

  const wsRows = await dbB.select<any[]>('SELECT * FROM "workspaces" WHERE "id" = $1', [wsA.id]);
  assert(wsRows.length > 0 && wsRows[0].name.includes('Candidate Master Workspace'), 'Device B: WORKSPACE entity pulled and applied locally');

  const nbRows = await dbB.select<any[]>('SELECT * FROM "notebooks" WHERE "id" = $1', [nbA.id]);
  assert(nbRows.length > 0 && nbRows[0].name.includes('Art & Culture'), 'Device B: NOTEBOOK entity pulled and applied locally');

  const grpRows = await dbB.select<any[]>('SELECT * FROM "section_groups" WHERE "id" = $1', [grpA.id]);
  assert(grpRows.length > 0 && grpRows[0].name.includes('Architecture & Literature'), 'Device B: SECTION_GROUP entity pulled and applied locally');

  const secRows = await dbB.select<any[]>('SELECT * FROM "sections" WHERE "id" = $1', [secA.id]);
  assert(secRows.length > 0 && secRows[0].name.includes('Temple Architecture'), 'Device B: SECTION entity pulled and applied locally');

  const pageRows = await dbB.select<any[]>('SELECT * FROM "pages" WHERE "id" = $1', [topicA.id]);
  assert(pageRows.length > 0 && pageRows[0].title.includes('Dravida Style'), 'Device B: PAGE entity pulled and applied locally');

  const attRows = await dbB.select<any[]>('SELECT * FROM "attachments" WHERE "id" = $1', [attA.id]);
  assert(attRows.length > 0 && attRows[0].originalFileName.includes('Brihadisvara'), 'Device B: ATTACHMENT entity pulled and applied locally');

  const tagRows = await dbB.select<any[]>('SELECT * FROM "tags" WHERE "id" = $1', ['tag_temple_art']);
  assert(tagRows.length > 0 && tagRows[0].name === 'Architecture', 'Device B: TAG entity pulled and applied locally');

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED (100% PASS RATE)!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runRealAuthAndFullSyncTest().catch((err) => {
  console.error('Real auth test error:', err);
  process.exit(1);
});
