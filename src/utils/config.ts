/**
 * Configuration management for Lovie CLI
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';

interface CliConfig {
  apiBaseUrl: string;
  apiKey: string;
  sessionStoragePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableUpdateCheck: boolean;
  enableAnalytics: boolean;
}

// Load environment variables
dotenvConfig();

/**
 * Get configuration from environment variables
 */
export function getConfig(): CliConfig {
  return {
    apiBaseUrl: process.env['API_BASE_URL'] || 'https://api.lovie.ai',
    apiKey: process.env['API_KEY'] || '',
    sessionStoragePath:
      process.env['SESSION_STORAGE_PATH'] ||
      path.join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.lovie', 'sessions'),
    logLevel: (process.env['LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info',
    enableUpdateCheck: process.env['ENABLE_UPDATE_CHECK'] !== 'false',
    enableAnalytics: process.env['ENABLE_ANALYTICS'] === 'true',
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: CliConfig): void {
  if (!config.apiBaseUrl) {
    throw new Error('API_BASE_URL is required');
  }

  if (!config.apiKey && process.env['NODE_ENV'] === 'production') {
    throw new Error('API_KEY is required in production');
  }
}

/**
 * Get agent API URLs with environment-based selection
 */
export function getAgentApiUrls(): {
  nameCheck: string;
  documentFiller: string;
  filing: string;
} {
  const baseUrl = process.env['API_BASE_URL'] || 'https://api.lovie.ai';
  const isProduction = process.env['NODE_ENV'] === 'production';

  // Select NAME_CHECK_API_URL based on environment
  const nameCheckUrl = isProduction
    ? process.env['NAME_CHECK_API_URL_SERVER'] || `${baseUrl}/name-check`
    : process.env['NAME_CHECK_API_URL'] || 'http://localhost:3000';

  return {
    nameCheck: nameCheckUrl,
    documentFiller: process.env['DOCUMENT_FILLER_API_URL'] || `${baseUrl}/document-filler`,
    filing: process.env['FILING_AGENT_API_URL'] || `${baseUrl}/filing`,
  };
}
