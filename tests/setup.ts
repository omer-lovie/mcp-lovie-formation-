/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOVIE_API_BASE_URL = 'https://api.test.lovie.dev';
process.env.LOVIE_API_KEY = 'test-api-key-12345';
process.env.LOVIE_STORAGE_DIR = '/tmp/lovie-test-sessions';

// Note: Jest globals (jest, expect, afterEach, etc.) are automatically available
// when running tests via Jest, so no imports needed
