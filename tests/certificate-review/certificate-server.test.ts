/**
 * Certificate Review Server Tests
 * Tests for local web server that displays certificate for approval
 * Feature 002: FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
 */

import { CertificateReviewServer, ServerEvent } from '../../src/services/certificate/server';
import http from 'http';

describe('CertificateReviewServer', () => {
  let server: CertificateReviewServer;
  const testCertificateUrl = 'https://example.com/certificate.pdf';
  const testCompanyName = 'Test Corporation';

  beforeEach(() => {
    server = new CertificateReviewServer();
  });

  afterEach(async () => {
    // Ensure server is stopped after each test
    if (server.getIsRunning()) {
      await server.stop();
    }
  });

  describe('Server lifecycle', () => {
    it('should start server successfully', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      expect(server.getIsRunning()).toBe(true);
      expect(server.getUrl()).toMatch(/^http:\/\/localhost:\d+$/);
    });

    it('should stop server successfully', async () => {
      await server.start(testCertificateUrl, testCompanyName);
      expect(server.getIsRunning()).toBe(true);

      await server.stop();

      expect(server.getIsRunning()).toBe(false);
    });

    it('should throw error when starting already running server', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      await expect(server.start(testCertificateUrl, testCompanyName)).rejects.toThrow(
        'Server is already running'
      );
    });

    it('should not throw error when stopping already stopped server', async () => {
      await expect(server.stop()).resolves.not.toThrow();
    });

    it('should throw error when getting URL of stopped server', () => {
      expect(() => server.getUrl()).toThrow('Server is not running');
    });

    it('should find available port when default is taken', async () => {
      const server1 = new CertificateReviewServer();
      const server2 = new CertificateReviewServer();

      try {
        await server1.start(testCertificateUrl, testCompanyName);
        await server2.start(testCertificateUrl, testCompanyName);

        const url1 = server1.getUrl();
        const url2 = server2.getUrl();

        expect(url1).not.toBe(url2);
      } finally {
        await server1.stop();
        await server2.stop();
      }
    }, 15000);

    it('should start on port 3456 by default', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const url = server.getUrl();
      expect(url).toBe('http://localhost:3456');
    });
  });

  describe('HTTP endpoints', () => {
    beforeEach(async () => {
      await server.start(testCertificateUrl, testCompanyName);
    });

    it('should serve main page at root path', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain(testCompanyName);
      expect(response.body).toContain(testCertificateUrl);
    });

    it('should serve main page at /index.html', async () => {
      const response = await makeRequest(server.getUrl(), '/index.html');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should handle approval endpoint', async () => {
      const approvalPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.APPROVED, resolve);
      });

      const response = await makeRequest(server.getUrl(), '/approve', 'POST');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Approved');

      await approvalPromise;
      expect(server.getIsRunning()).toBe(false); // Server should stop
    }, 10000);

    it('should handle cancellation endpoint', async () => {
      const cancellationPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.CANCELLED, resolve);
      });

      const response = await makeRequest(server.getUrl(), '/cancel', 'POST');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cancelled');

      await cancellationPromise;
      expect(server.getIsRunning()).toBe(false); // Server should stop
    }, 10000);

    it('should return 404 for unknown paths', async () => {
      const response = await makeRequest(server.getUrl(), '/unknown');

      expect(response.statusCode).toBe(404);
      expect(response.body).toContain('Not Found');
    });

    it('should only accept POST for approval endpoint', async () => {
      const response = await makeRequest(server.getUrl(), '/approve', 'GET');

      expect(response.statusCode).toBe(404);
    });

    it('should only accept POST for cancel endpoint', async () => {
      const response = await makeRequest(server.getUrl(), '/cancel', 'GET');

      expect(response.statusCode).toBe(404);
    });
  });

  describe('HTML generation', () => {
    beforeEach(async () => {
      await server.start(testCertificateUrl, testCompanyName);
    });

    it('should include certificate URL in iframe', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain(`src="${testCertificateUrl}"`);
    });

    it('should include company name in header', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain(testCompanyName);
    });

    it('should escape HTML special characters in company name', async () => {
      await server.stop();

      const maliciousName = '<script>alert("xss")</script>';
      await server.start(testCertificateUrl, maliciousName);

      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).not.toContain('<script>');
      expect(response.body).toContain('&lt;script&gt;');
    });

    it('should escape HTML special characters in URL', async () => {
      await server.stop();

      const maliciousUrl = 'https://example.com/test?param=<script>';
      await server.start(maliciousUrl, testCompanyName);

      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain('&lt;script&gt;');
    });

    it('should include approve button', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain('Approve & Continue to Payment');
    });

    it('should include cancel button', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain('Cancel');
    });

    it('should include CSS for styling', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain('<style>');
      expect(response.body).toContain('.btn-approve');
      expect(response.body).toContain('.btn-cancel');
    });

    it('should include JavaScript for interactions', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).toContain('<script>');
      expect(response.body).toContain('handleApprove');
      expect(response.body).toContain('handleCancel');
    });

    it('should set cache-control headers', async () => {
      const response = await makeRequest(server.getUrl(), '/');

      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('Event emission', () => {
    beforeEach(async () => {
      await server.start(testCertificateUrl, testCompanyName);
    });

    it('should emit APPROVED event on approval', async () => {
      const eventPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.APPROVED, resolve);
      });

      await makeRequest(server.getUrl(), '/approve', 'POST');
      await eventPromise;
    });

    it('should emit CANCELLED event on cancellation', async () => {
      const eventPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.CANCELLED, resolve);
      });

      await makeRequest(server.getUrl(), '/cancel', 'POST');
      await eventPromise;
    });

    it('should emit TIMEOUT event after 10 minutes', async () => {
      const timeoutPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.TIMEOUT, resolve);
      });

      // Fast-forward time
      jest.useFakeTimers();
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await timeoutPromise;

      jest.useRealTimers();
    });

    it('should emit ERROR event on server error', async () => {
      const errorPromise = new Promise<Error>((resolve) => {
        server.once(ServerEvent.ERROR, resolve);
      });

      // Trigger an error by trying to bind to an invalid port
      server.emit(ServerEvent.ERROR, new Error('Test error'));

      const error = await errorPromise;
      expect(error.message).toBe('Test error');
    });
  });

  describe('Timeout handling', () => {
    it('should stop server after timeout', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const timeoutPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.TIMEOUT, resolve);
      });

      jest.useFakeTimers();
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await timeoutPromise;

      expect(server.getIsRunning()).toBe(false);

      jest.useRealTimers();
    });

    it('should clear timeout when server is stopped manually', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      jest.useFakeTimers();
      await server.stop();

      // Advance time past timeout
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      // Should not emit timeout event
      const timeoutEmitted = new Promise((resolve) => {
        server.once(ServerEvent.TIMEOUT, () => resolve(true));
        setTimeout(() => resolve(false), 100);
      });

      const result = await timeoutEmitted;
      expect(result).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty company name', async () => {
      await server.start(testCertificateUrl, '');

      const response = await makeRequest(server.getUrl(), '/');
      expect(response.statusCode).toBe(200);
    });

    it('should handle very long company name', async () => {
      const longName = 'A'.repeat(500);
      await server.start(testCertificateUrl, longName);

      const response = await makeRequest(server.getUrl(), '/');
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain(longName);
    });

    it('should handle concurrent requests', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const requests = Array(10)
        .fill(null)
        .map(() => makeRequest(server.getUrl(), '/'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle rapid start/stop cycles', async () => {
      for (let i = 0; i < 5; i++) {
        await server.start(testCertificateUrl, testCompanyName);
        expect(server.getIsRunning()).toBe(true);

        await server.stop();
        expect(server.getIsRunning()).toBe(false);
      }
    });
  });

  describe('Security', () => {
    it('should set CORS headers on approval endpoint', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await makeRequest(server.getUrl(), '/approve', 'POST');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should escape HTML entities to prevent XSS', async () => {
      const xssPayload = '"><script>alert("xss")</script>';
      await server.start(testCertificateUrl, xssPayload);

      const response = await makeRequest(server.getUrl(), '/');

      expect(response.body).not.toContain('<script>alert');
    });

    it('should handle malicious URLs safely', async () => {
      const maliciousUrl = 'javascript:alert("xss")';
      await server.start(maliciousUrl, testCompanyName);

      const response = await makeRequest(server.getUrl(), '/');

      expect(response.statusCode).toBe(200);
    });
  });
});

/**
 * Helper function to make HTTP requests
 */
function makeRequest(
  baseUrl: string,
  path: string,
  method: string = 'GET'
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method
      },
      (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 500,
            headers: res.headers,
            body
          });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}
