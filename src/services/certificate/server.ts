/**
 * Local web server for certificate review
 * Displays PDF in browser with approval button
 * Feature 002: FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
 */

import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

const DEFAULT_PORT = 3456;
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Server events
 */
export enum ServerEvent {
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}

/**
 * Certificate review server
 * Hosts a simple web interface for PDF preview and approval
 */
export class CertificateReviewServer extends EventEmitter {
  private server: Server | null = null;
  private port: number = DEFAULT_PORT;
  private isRunning: boolean = false;
  private timeoutHandle: NodeJS.Timeout | null = null;

  /**
   * Start the server and wait for user action
   * @param certificateUrl - Presigned S3 URL for the certificate PDF
   * @param companyName - Company name for display
   * @returns Promise that resolves when user approves or cancels
   */
  async start(certificateUrl: string, companyName: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    // Find available port
    this.port = await this.findAvailablePort(DEFAULT_PORT);

    // Create server
    this.server = createServer((req, res) => {
      this.handleRequest(req, res, certificateUrl, companyName);
    });

    // Handle server errors
    this.server.on('error', (error) => {
      this.emit(ServerEvent.ERROR, error);
    });

    // Start server
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, () => {
        this.isRunning = true;
        resolve();
      });

      this.server!.on('error', reject);
    });

    // Set timeout
    this.timeoutHandle = setTimeout(() => {
      this.emit(ServerEvent.TIMEOUT);
      this.stop();
    }, TIMEOUT_MS);
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    // Clear timeout
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    // Close server
    await new Promise<void>((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        this.server = null;
        resolve();
      });
    });
  }

  /**
   * Get the local server URL
   */
  getUrl(): string {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Check if server is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    certificateUrl: string,
    companyName: string
  ): void {
    const url = req.url || '/';

    // Handle approval endpoint
    if (url === '/approve' && req.method === 'POST') {
      this.handleApproval(req, res);
      return;
    }

    // Handle cancellation endpoint
    if (url === '/cancel' && req.method === 'POST') {
      this.handleCancellation(req, res);
      return;
    }

    // Serve main page
    if (url === '/' || url === '/index.html') {
      this.serveMainPage(res, certificateUrl, companyName);
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  /**
   * Serve the main certificate review page
   */
  private serveMainPage(
    res: ServerResponse,
    certificateUrl: string,
    companyName: string
  ): void {
    const html = this.generateHtml(certificateUrl, companyName);

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(html);
  }

  /**
   * Handle approval request
   */
  private handleApproval(req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: true, message: 'Approved' }));

    // Emit approval event
    this.emit(ServerEvent.APPROVED);

    // Stop server after short delay to ensure response is sent
    setTimeout(() => this.stop(), 500);
  }

  /**
   * Handle cancellation request
   */
  private handleCancellation(req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: true, message: 'Cancelled' }));

    // Emit cancellation event
    this.emit(ServerEvent.CANCELLED);

    // Stop server after short delay to ensure response is sent
    setTimeout(() => this.stop(), 500);
  }

  /**
   * Generate HTML for certificate review page
   */
  private generateHtml(certificateUrl: string, companyName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review Certificate - ${this.escapeHtml(companyName)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 40px);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px 32px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .pdf-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        #pdfViewer {
            flex: 1;
            border: none;
            width: 100%;
            height: 100%;
        }

        .pdf-fallback {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
            gap: 16px;
            background: #f8f9fa;
            border-top: 2px solid #e9ecef;
        }

        .pdf-fallback.show {
            display: flex;
        }

        .pdf-fallback-compact {
            padding: 16px;
        }

        .pdf-fallback-compact h2 {
            font-size: 16px;
            margin-bottom: 8px;
        }

        .pdf-fallback-compact p {
            font-size: 14px;
            margin-bottom: 12px;
        }

        .pdf-fallback-icon {
            font-size: 64px;
            color: #667eea;
        }

        .pdf-fallback h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 8px;
        }

        .pdf-fallback p {
            font-size: 16px;
            color: #666;
            margin-bottom: 16px;
        }

        .btn-download {
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }

        .btn-download:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .pdf-loading {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
        }

        .pdf-loading.hide {
            display: none;
        }

        .action-bar {
            background: #f8f9fa;
            padding: 24px 32px;
            display: flex;
            justify-content: center;
            gap: 16px;
            border-top: 1px solid #e9ecef;
        }

        button {
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-approve {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-approve:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .btn-approve:active {
            transform: translateY(0);
        }

        .btn-cancel {
            background: #6c757d;
            color: white;
        }

        .btn-cancel:hover {
            background: #5a6268;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 40px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            display: none;
            text-align: center;
            padding: 40px;
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Review Your Certificate of Incorporation</h1>
            <p>${this.escapeHtml(companyName)}</p>
        </div>

        <div class="pdf-container">
            <div class="pdf-loading" id="pdfLoading">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #666;">Loading your certificate...</p>
            </div>

            <iframe
                id="pdfViewer"
                src="${this.escapeHtml(certificateUrl)}#toolbar=1&navpanes=0&scrollbar=1"
                type="application/pdf"
                style="display: none;">
            </iframe>

            <!-- Main fallback (shown when PDF completely fails) -->
            <div class="pdf-fallback" id="pdfFallbackFull" style="display: none;">
                <div class="pdf-fallback-icon">📄</div>
                <h2>PDF Viewer Not Available</h2>
                <p>Your browser cannot display the PDF inline.<br>Please use one of the options below to view your certificate:</p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <a href="${this.escapeHtml(certificateUrl)}"
                       class="btn-download"
                       target="_blank"
                       rel="noopener noreferrer">
                        🔗 Open in New Tab
                    </a>
                    <a href="${this.escapeHtml(certificateUrl)}"
                       class="btn-download"
                       download="certificate-of-incorporation.pdf">
                        📥 Download PDF
                    </a>
                </div>
                <p style="font-size: 14px; color: #999; margin-top: 16px;">
                    After reviewing the PDF, return here to approve or cancel.
                </p>
            </div>

            <!-- Compact alternative options (shown below iframe as backup) -->
            <div class="pdf-fallback pdf-fallback-compact" id="pdfFallbackCompact" style="display: none;">
                <p style="margin: 0 0 12px 0; color: #666;">
                    <strong>Can't see the PDF?</strong> Try these alternatives:
                </p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <a href="${this.escapeHtml(certificateUrl)}"
                       class="btn-download"
                       target="_blank"
                       rel="noopener noreferrer"
                       style="padding: 10px 20px; font-size: 14px;">
                        🔗 Open in New Tab
                    </a>
                    <a href="${this.escapeHtml(certificateUrl)}"
                       class="btn-download"
                       download="certificate-of-incorporation.pdf"
                       style="padding: 10px 20px; font-size: 14px;">
                        📥 Download PDF
                    </a>
                </div>
            </div>
        </div>

        <div class="action-bar">
            <button class="btn-cancel" onclick="handleCancel()">Cancel</button>
            <button class="btn-approve" onclick="handleApprove()">✓ Approve & Continue to Payment</button>
        </div>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Processing your decision...</p>
        </div>

        <div class="error" id="error">
            <p>An error occurred. Please try again.</p>
        </div>
    </div>

    <script>
        // PDF Loading Detection
        const pdfViewer = document.getElementById('pdfViewer');
        const pdfLoading = document.getElementById('pdfLoading');
        const pdfFallbackFull = document.getElementById('pdfFallbackFull');
        const pdfFallbackCompact = document.getElementById('pdfFallbackCompact');
        const certificateUrl = '${this.escapeHtml(certificateUrl)}';
        let pdfLoadSuccessful = false;
        let loadCheckTimeout = null;

        console.log('=== PDF Viewer Debug Info ===');
        console.log('Certificate URL:', certificateUrl);
        console.log('Browser:', navigator.userAgent);
        console.log('PDF MIME support:', navigator.mimeTypes['application/pdf'] ? 'Yes' : 'No');
        console.log('Attempting to load PDF in iframe...');

        // Function to show PDF successfully (with backup options below)
        function showPdfSuccess() {
            console.log('✓ Attempting to display PDF');
            pdfLoadSuccessful = true;
            clearTimeout(loadCheckTimeout);
            pdfLoading.classList.add('hide');
            pdfViewer.style.display = 'block';

            // Show compact fallback as backup after 3 seconds
            setTimeout(() => {
                pdfFallbackCompact.style.display = 'flex';
                console.log('→ Showing backup options below PDF iframe');
            }, 3000);
        }

        // Function to show full fallback (PDF completely failed)
        function showPdfFallback() {
            console.log('✗ PDF failed to load, showing fallback');
            pdfLoadSuccessful = true; // Mark as handled
            clearTimeout(loadCheckTimeout);
            pdfLoading.classList.add('hide');
            pdfViewer.style.display = 'none';
            pdfFallbackFull.style.display = 'flex';
        }

        // Listen for iframe load event
        pdfViewer.addEventListener('load', function() {
            console.log('✓ Iframe load event fired');

            // Give the browser a moment to actually render the PDF
            setTimeout(() => {
                // Check if iframe actually loaded PDF content
                try {
                    // Try to access iframe document (will fail for cross-origin)
                    const iframeDoc = pdfViewer.contentDocument || pdfViewer.contentWindow.document;
                    if (iframeDoc) {
                        console.log('→ Iframe document accessible, checking content...');
                        showPdfSuccess();
                    }
                } catch (e) {
                    // Cross-origin or PDF loaded (both are OK for PDFs)
                    console.log('→ Cross-origin or PDF loaded (this is expected for PDFs)');
                    showPdfSuccess();
                }
            }, 500); // Wait 500ms for PDF plugin to initialize
        });

        // Listen for iframe errors
        pdfViewer.addEventListener('error', function(e) {
            console.error('✗ Iframe error:', e);
            showPdfFallback();
        });

        // Timeout: If nothing happens after 4 seconds, show iframe anyway
        // (some browsers don't fire load event for PDFs but display them fine)
        loadCheckTimeout = setTimeout(() => {
            if (!pdfLoadSuccessful) {
                console.warn('⚠ No load event after 4 seconds');
                console.log('→ Showing iframe anyway (browser may display PDF without firing event)');

                // Show the iframe regardless - it might be working
                pdfLoadSuccessful = true;
                pdfLoading.classList.add('hide');
                pdfViewer.style.display = 'block';

                // Show compact fallback after 2 more seconds as backup
                setTimeout(() => {
                    pdfFallbackCompact.style.display = 'flex';
                    console.log('→ Showing backup download options');
                }, 2000);
            }
        }, 4000);

        // Additional check: Try to detect if browser doesn't support PDF viewing
        if (!navigator.pdfViewerEnabled && navigator.mimeTypes['application/pdf'] === undefined) {
            console.warn('⚠ Browser may not support inline PDF viewing');
        }

        async function handleApprove() {
            try {
                document.querySelector('.action-bar').style.display = 'none';
                document.getElementById('loading').style.display = 'block';

                const response = await fetch('/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // Close window after short delay
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    showError();
                }
            } catch (error) {
                showError();
            }
        }

        async function handleCancel() {
            if (!confirm('Are you sure you want to cancel? You can make changes to your information.')) {
                return;
            }

            try {
                document.querySelector('.action-bar').style.display = 'none';
                document.getElementById('loading').style.display = 'block';

                const response = await fetch('/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    showError();
                }
            } catch (error) {
                showError();
            }
        }

        function showError() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            setTimeout(() => {
                document.getElementById('error').style.display = 'none';
                document.querySelector('.action-bar').style.display = 'flex';
            }, 3000);
        }

        // Warn user if they try to close the window
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
    </script>
</body>
</html>`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Find an available port
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    let port = startPort;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
      port++;
    }

    throw new Error(`No available ports found between ${startPort} and ${port}`);
  }

  /**
   * Check if a port is available
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const testServer = createServer();

      testServer.once('error', () => {
        resolve(false);
      });

      testServer.once('listening', () => {
        testServer.close();
        resolve(true);
      });

      testServer.listen(port);
    });
  }
}
