/**
 * Browser launcher utility
 * Opens URLs in the user's default browser
 * Feature 002: FR-005
 */

import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Open a URL in the user's default browser
 * @param url - URL to open
 * @throws Error if unable to open browser
 */
export async function openBrowser(url: string): Promise<void> {
  const os = platform();

  try {
    switch (os) {
      case 'darwin': // macOS
        await execAsync(`open "${url}"`);
        break;

      case 'win32': // Windows
        await execAsync(`start "${url}"`);
        break;

      case 'linux': // Linux
        // Try common Linux browsers
        try {
          await execAsync(`xdg-open "${url}"`);
        } catch (error) {
          // Fallback to other methods
          try {
            await execAsync(`sensible-browser "${url}"`);
          } catch (innerError) {
            await execAsync(`x-www-browser "${url}"`);
          }
        }
        break;

      default:
        throw new Error(`Unsupported operating system: ${os}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to open browser: ${error.message}. Please manually open: ${url}`
      );
    }
    throw new Error(`Failed to open browser. Please manually open: ${url}`);
  }
}

/**
 * Check if the system has a default browser configured
 * @returns True if a default browser is available
 */
export async function hasDefaultBrowser(): Promise<boolean> {
  const os = platform();

  try {
    switch (os) {
      case 'darwin':
        // macOS always has a default browser (Safari)
        return true;

      case 'win32':
        // Check Windows registry for default browser
        await execAsync('reg query HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice');
        return true;

      case 'linux':
        // Check if xdg-open is available
        await execAsync('which xdg-open');
        return true;

      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}
