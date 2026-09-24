// Automated Production Readiness Verification Script
process.env.PORT = '5099';
process.env.HOST = '127.0.0.1';
process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://pscvault.vercel.app';
process.env.JWT_SECRET = 'test_production_readiness_secret_1234567890_super_secure';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 PSCVault Production Backend Readiness Test Suite');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // Import the production build (it automatically calls startServer() on PORT 5099)
  await import('../dist-server/index.js');
  // Wait 100ms for server to bind
  await new Promise(r => setTimeout(r, 200));

  try {
    const baseUrl = 'http://127.0.0.1:5099';

    // TEST 1: GET /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.status === 'ok' && healthData.service === 'PSCVault API',
      'GET /api/health returns 200 OK with safe service info',
      `status: ${healthData.status}, database: ${healthData.database}`
    );

    // TEST 2: Verify No Secrets Leaked in /api/health
    const healthString = JSON.stringify(healthData);
    const leakedSecret = healthString.includes('mongodb') || healthString.includes('secret') || healthString.includes('password');
    assert(!leakedSecret, 'Health endpoint does NOT leak URI, credentials, or secrets');

    // TEST 3: Root /health check
    const rootHealthRes = await fetch(`${baseUrl}/health`);
    const rootHealthData = await rootHealthRes.json();
    assert(rootHealthRes.status === 200 && rootHealthData.status === 'ok', 'GET /health alias returns 200 OK');

    // TEST 4: CORS Support for Production Frontend (pscvault.vercel.app)
    const corsRes = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://pscvault.vercel.app',
        'Access-Control-Request-Method': 'POST',
      },
    });
    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    const allowCreds = corsRes.headers.get('access-control-allow-credentials');
    assert(
      allowOrigin === 'https://pscvault.vercel.app' && allowCreds === 'true',
      'CORS headers properly configured for production frontend',
      `Origin: ${allowOrigin}, Credentials: ${allowCreds}`
    );

    // TEST 5: CORS Rejection for Unauthorized Origins
    let corsRejected = false;
    try {
      const badCorsRes = await fetch(`${baseUrl}/api/health`, {
        headers: { 'Origin': 'https://malicious-phishing-site.com' },
      });
      corsRejected = badCorsRes.status === 500 || !badCorsRes.headers.get('access-control-allow-origin');
    } catch {
      corsRejected = true;
    }
    assert(corsRejected, 'CORS blocks unauthorized malicious origins');

    // TEST 6: Protected Route Rejection Without Token
    const unauthRes = await fetch(`${baseUrl}/api/workspace`);
    assert(unauthRes.status === 401, 'Protected route /api/workspace requires authentication (HTTP 401)');

    // TEST 7: User A Registration
    const userARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-id': 'dev-test-a' },
      body: JSON.stringify({
        name: 'Aspirant Alpha',
        email: 'alpha@pscvault.org',
        password: 'PasswordAlpha2027!',
      }),
    });
    const userAData = await userARes.json();
    assert(userARes.status === 201 && !!userAData.token, 'User A registers successfully with valid JWT token');

    // TEST 8: User B Registration
    const userBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-id': 'dev-test-b' },
      body: JSON.stringify({
        name: 'Aspirant Beta',
        email: 'beta@pscvault.org',
        password: 'PasswordBeta2027!',
      }),
    });
    const userBData = await userBRes.json();
    assert(userBRes.status === 201 && !!userBData.token, 'User B registers successfully with valid JWT token');

    // TEST 9: User Isolation (User A creates notebook, User B cannot access it)
    const createNbRes = await fetch(`${baseUrl}/api/notebooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAData.token}`,
      },
      body: JSON.stringify({
        id: 'nb_alpha_private_001',
        workspaceId: 'ws_alpha',
        name: 'Alpha Secret GS Notes',
      }),
    });
    assert(createNbRes.status === 201, 'User A creates a private notebook');

    // User B attempts to read notebooks
    const userBNbRes = await fetch(`${baseUrl}/api/notebooks`, {
      headers: {
        'Authorization': `Bearer ${userBData.token}`,
      },
    });
    const userBNbs = await userBNbRes.json();
    const hasAlphaNb = userBNbs.some(nb => nb.id === 'nb_alpha_private_001');
    assert(!hasAlphaNb, 'Strict User Isolation: User B cannot view User A notebooks');

    // TEST 10: IDOR Protection on Update (User B attempts to modify User A notebook)
    const idorPatchRes = await fetch(`${baseUrl}/api/notebooks/nb_alpha_private_001`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userBData.token}`,
      },
      body: JSON.stringify({
        name: 'Hacked by Beta',
      }),
    });
    const idorPatchData = await idorPatchRes.json();
    assert(!idorPatchData || idorPatchData.id !== 'nb_alpha_private_001', 'IDOR Protected: User B cannot modify User A notebook');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n--------------------------------------------------------');
  console.log(`RESULTS: ${passed} / ${total} tests passed.`);
  console.log('========================================================\n');

  if (passed === total) {
    console.log('🎉 ALL PRODUCTION READINESS CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
