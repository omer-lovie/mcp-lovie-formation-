/**
 * Quick test script for Delaware Name Check API integration
 */

require('dotenv').config();

// Simple test without TypeScript
async function testNameCheck() {
  const apiUrl = process.env.NAME_CHECK_API_URL || 'https://fabulous-communication-production.up.railway.app';
  
  console.log('🧪 Testing Delaware Name Check API Integration\n');
  console.log('API URL:', apiUrl);
  console.log('');

  // Test 1: Available name
  console.log('Test 1: Checking likely available name...');
  try {
    const response1 = await fetch(`${apiUrl}/api/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseName: 'TestCompanyUnique12345',
        entityType: 'Y',
        entityEnding: 'LLC'
      })
    });
    
    const result1 = await response1.json();
    console.log('✓ Response:', result1.status);
    console.log('  Company:', result1.companyName);
    console.log('  Response Time:', result1.responseTimeMs, 'ms');
    console.log('  CAPTCHA Attempts:', result1.captchaAttempts);
    console.log('');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 2: Likely unavailable name
  console.log('Test 2: Checking likely unavailable name...');
  try {
    const response2 = await fetch(`${apiUrl}/api/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseName: 'Google',
        entityType: 'Y',
        entityEnding: 'LLC'
      })
    });
    
    const result2 = await response2.json();
    console.log('✓ Response:', result2.status);
    console.log('  Company:', result2.companyName);
    console.log('  Rejection Reasons:', result2.rejectionReasons);
    console.log('');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 3: Health check
  console.log('Test 3: Checking API health...');
  try {
    const response3 = await fetch(`${apiUrl}/health`);
    const result3 = await response3.json();
    console.log('✓ API Status:', result3.status);
    console.log('  Timestamp:', result3.timestamp);
    console.log('');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  console.log('✅ All tests complete!');
}

testNameCheck().catch(console.error);
