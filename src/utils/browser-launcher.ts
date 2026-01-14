/**
 * Cross-platform browser launcher utility
 * Opens the default system browser to a specified URL
 * Feature 002: FR-008 (Browser Auto-Open)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

/**
 * Browser launch result
 */
export interface BrowserLaunchResult {
  success: boolean;
  error?: string;
  manualUrl?: string;
}

/**
 * Open URL in the default system browser
 * Supports macOS, Windows, and Linux
 *
 * @param url - The URL to open
 * @returns Promise with launch result
 */
export async function openBrowser(url: string): Promise<BrowserLaunchResult> {
  try {
    const command = getBrowserCommand(url);

    await execAsync(command);

    return {
      success: true
    };
  } catch (error) {
    // If auto-open fails, return manual URL for user to open
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      manualUrl: url
    };
  }
}

/**
 * Get the appropriate command for opening a browser based on the OS
 *
 * @param url - The URL to open
 * @returns Command string for the current platform
 */
function getBrowserCommand(url: string): string {
  const os = platform();

  switch (os) {
    case 'darwin': // macOS
      return `open "${url}"`;

    case 'win32': // Windows
      // Use 'start' command, empty string before URL prevents URL from being treated as window title
      return `start "" "${url}"`;

    case 'linux':
      // Try xdg-open first (most common), fall back to others
      return `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`;

    default:
      throw new Error(`Unsupported operating system: ${os}`);
  }
}

/**
 * Check if a URL is accessible
 * Used to verify local server is running before opening browser
 *
 * @param url - The URL to check
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves to true if URL is accessible
 */
export async function waitForServer(
  url: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 100; // Check every 100ms

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Try to fetch the URL
      const response = await fetch(url, {
        method: 'HEAD',
        // @ts-ignore - signal is supported in Node.js 18+
        signal: AbortSignal.timeout(1000)
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet, wait and try again
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  return false;
}

/**
 * Open browser and wait for server to be ready
 * This ensures the server is listening before opening the browser
 *
 * @param url - The URL to open
 * @param waitForReady - Whether to wait for server to be ready (default: true)
 * @returns Promise with launch result
 */
export async function openBrowserWhenReady(
  url: string,
  waitForReady: boolean = true
): Promise<BrowserLaunchResult> {
  if (waitForReady) {
    const serverReady = await waitForServer(url);

    if (!serverReady) {
      return {
        success: false,
        error: 'Server did not respond in time',
        manualUrl: url
      };
    }
  }

  return openBrowser(url);
}

/**
 * Get platform-specific instructions for manually opening a browser
 * Used when auto-open fails
 *
 * @param url - The URL to open
 * @returns Human-readable instructions
 */
export function getManualOpenInstructions(url: string): string {
  const os = platform();

  const instructions: Record<string, string> = {
    darwin: `Please open your browser and navigate to:\n${url}`,
    win32: `Please open your browser and navigate to:\n${url}`,
    linux: `Please open your browser and navigate to:\n${url}`
  };

  return instructions[os] || `Please open your browser and navigate to:\n${url}`;
}
