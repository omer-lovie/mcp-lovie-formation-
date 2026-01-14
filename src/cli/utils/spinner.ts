/**
 * Spinner utilities for loading indicators
 * FR-009: Show loading indicators/spinners during background operations
 */

import ora, { Ora } from 'ora';

export class SpinnerManager {
  private spinner: Ora | null = null;

  /**
   * Start a spinner with a message
   */
  start(message: string): void {
    if (this.spinner) {
      this.spinner.stop();
    }
    this.spinner = ora(message).start();
  }

  /**
   * Update spinner text
   */
  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  /**
   * Mark spinner as successful
   */
  succeed(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  /**
   * Mark spinner as failed
   */
  fail(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  /**
   * Show warning
   */
  warn(message: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = null;
    }
  }

  /**
   * Show info
   */
  info(message: string): void {
    if (this.spinner) {
      this.spinner.info(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner without status
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Check if spinner is active
   */
  isSpinning(): boolean {
    return this.spinner !== null;
  }
}

// Singleton instance
export const spinner = new SpinnerManager();
