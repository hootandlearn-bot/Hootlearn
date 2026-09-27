
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hoot_key';
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Auth Refresh Tests ---');
  
  // 1. Get the test user
  const user = await prisma.user.findUnique({ where: { email: 'test@hootlearn.com' } });
  if (!user) {
    console.error('Test user not found!');
    process.exit(1);
  }

  // 2. Generate a deliberately EXPIRED token (expired 1 hour ago)
  const expiredToken = jwt.sign({ id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '-1h' });
  console.log('✅ Generated an expired token for testing.');

  // 3. Test hitting a protected route (/api/resources) with the expired token
  console.log('\nTest A: Fetch resources with expired token...');
  const res1 = await fetch(`${API_URL}/resources`, {
    headers: { 'Authorization': `Bearer ${expiredToken}` }
  });
  
  const data1 = await res1.json();
  if (res1.status === 401 && data1.code === 'TOKEN_EXPIRED') {
    console.log('✅ PASS: Server correctly rejected expired token and returned TOKEN_EXPIRED code.');
  } else {
    console.error('❌ FAIL: Expected 401 TOKEN_EXPIRED, got:', res1.status, data1);
    process.exit(1);
  }

  // 4. Test the /api/auth/refresh endpoint
  console.log('\nTest B: Attempt to refresh the expired token...');
  const res2 = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${expiredToken}` }
  });
  
  const data2 = await res2.json();
  let newToken = null;
  if (res2.ok && data2.token) {
    newToken = data2.token;
    console.log('✅ PASS: Server accepted the expired token and generated a BRAND NEW token!');
  } else {
    console.error('❌ FAIL: Expected new token, got:', res2.status, data2);
    process.exit(1);
  }

  // 5. Test hitting the protected route with the NEW token
  console.log('\nTest C: Fetch resources with the newly refreshed token...');
  const res3 = await fetch(`${API_URL}/resources`, {
    headers: { 'Authorization': `Bearer ${newToken}` }
  });
  
  if (res3.ok) {
    const resources = await res3.json();
    if (resources.length > 0 && resources[0].fileUrl) {
      console.log('✅ PASS: Successfully fetched resources! fileUrls are present (Auth succeeded).');
    } else {
      console.warn('⚠️ Warning: Fetched resources but fileUrl is missing (Are S3 keys configured locally?)');
    }
  } else {
    console.error('❌ FAIL: Failed to fetch resources with new token:', res3.status);
    process.exit(1);
  }

  console.log('\n🎉 ALL REFRESH FEATURE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
