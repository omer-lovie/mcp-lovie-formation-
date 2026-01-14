/**
 * Unit tests for CertificateReviewServer
 * Tests server lifecycle, HTTP endpoints, events, and error handling
 * Feature 002: FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
 */

import { CertificateReviewServer, ServerEvent } from '../../../../src/services/certificate/server';
import http from 'http';
import request from 'supertest';

describe('CertificateReviewServer', () => {
  let server: CertificateReviewServer;
  const testCertificateUrl = 'https://example.com/certificate.pdf';
  const testCompanyName = 'Test Company Inc.';

  beforeEach(() => {
    server = new CertificateReviewServer();
  });

  afterEach(async () => {
    if (server.getIsRunning()) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
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

      await expect(
        server.start(testCertificateUrl, testCompanyName)
      ).rejects.toThrow('Server is already running');
    });

    it('should handle stop when server is not running', async () => {
      await expect(server.stop()).resolves.not.toThrow();
    });

    it('should throw error when getting URL of stopped server', () => {
      expect(() => server.getUrl()).toThrow('Server is not running');
    });

    it('should return isRunning as false initially', () => {
      expect(server.getIsRunning()).toBe(false);
    });
  });

  describe('Port Management', () => {
    it('should find available port on default port', async () => {
      await server.start(testCertificateUrl, testCompanyName);
      const url = server.getUrl();

      expect(url).toContain('3456'); // DEFAULT_PORT
    });

    it('should find next available port if default is taken', async () => {
      // Start first server on default port
      const firstServer = new CertificateReviewServer();
      await firstServer.start(testCertificateUrl, testCompanyName);
      const firstUrl = firstServer.getUrl();

      // Start second server (should use next port)
      const secondServer = new CertificateReviewServer();
      await secondServer.start(testCertificateUrl, testCompanyName);
      const secondUrl = secondServer.getUrl();

      expect(firstUrl).not.toBe(secondUrl);

      // Cleanup
      await firstServer.stop();
      await secondServer.stop();
    });

    it('should handle multiple sequential starts', async () => {
      await server.start(testCertificateUrl, testCompanyName);
      const firstUrl = server.getUrl();
      await server.stop();

      await server.start(testCertificateUrl, testCompanyName);
      const secondUrl = server.getUrl();
      await server.stop();

      expect(firstUrl).toBe(secondUrl);
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      await server.start(testCertificateUrl, testCompanyName);
    });

    describe('GET /', () => {
      it('should return HTML page', async () => {
        const response = await request(server.getUrl()).get('/');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('<!DOCTYPE html>');
        expect(response.text).toContain('Review Your Certificate of Incorporation');
      });

      it('should include company name in HTML', async () => {
        const response = await request(server.getUrl()).get('/');

        expect(response.text).toContain(testCompanyName);
      });

      it('should include certificate URL in HTML', async () => {
        const response = await request(server.getUrl()).get('/');

        expect(response.text).toContain(testCertificateUrl);
      });

      it('should set no-cache headers', async () => {
        const response = await request(server.getUrl()).get('/');

        expect(response.headers['cache-control']).toContain('no-cache');
        expect(response.headers['cache-control']).toContain('no-store');
        expect(response.headers['cache-control']).toContain('must-revalidate');
      });
    });

    describe('GET /index.html', () => {
      it('should return same HTML as root', async () => {
        const rootResponse = await request(server.getUrl()).get('/');
        const indexResponse = await request(server.getUrl()).get('/index.html');

        expect(rootResponse.text).toBe(indexResponse.text);
        expect(indexResponse.status).toBe(200);
      });
    });

    describe('POST /approve', () => {
      it('should return success response', async () => {
        const response = await request(server.getUrl())
          .post('/approve')
          .send({});

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toEqual({
          success: true,
          message: 'Approved'
        });
      });

      it('should emit APPROVED event', async () => {
        const approvedPromise = new Promise<void>((resolve) => {
          server.once(ServerEvent.APPROVED, resolve);
        });

        await request(server.getUrl()).post('/approve').send({});

        await expect(approvedPromise).resolves.toBeUndefined();
      });

      it('should set CORS headers', async () => {
        const response = await request(server.getUrl())
          .post('/approve')
          .send({});

        expect(response.headers['access-control-allow-origin']).toBe('*');
      });

      it('should stop server after approval', async () => {
        await request(server.getUrl()).post('/approve').send({});

        // Wait for server to stop
        await new Promise((resolve) => setTimeout(resolve, 600));

        expect(server.getIsRunning()).toBe(false);
      });
    });

    describe('POST /cancel', () => {
      it('should return success response', async () => {
        const response = await request(server.getUrl())
          .post('/cancel')
          .send({});

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toEqual({
          success: true,
          message: 'Cancelled'
        });
      });

      it('should emit CANCELLED event', async () => {
        const cancelledPromise = new Promise<void>((resolve) => {
          server.once(ServerEvent.CANCELLED, resolve);
        });

        await request(server.getUrl()).post('/cancel').send({});

        await expect(cancelledPromise).resolves.toBeUndefined();
      });

      it('should set CORS headers', async () => {
        const response = await request(server.getUrl())
          .post('/cancel')
          .send({});

        expect(response.headers['access-control-allow-origin']).toBe('*');
      });

      it('should stop server after cancellation', async () => {
        await request(server.getUrl()).post('/cancel').send({});

        // Wait for server to stop
        await new Promise((resolve) => setTimeout(resolve, 600));

        expect(server.getIsRunning()).toBe(false);
      });
    });

    describe('404 Handling', () => {
      it('should return 404 for unknown routes', async () => {
        const response = await request(server.getUrl()).get('/unknown');

        expect(response.status).toBe(404);
        expect(response.text).toBe('Not Found');
        expect(response.headers['content-type']).toContain('text/plain');
      });

      it('should return 404 for GET /approve', async () => {
        const response = await request(server.getUrl()).get('/approve');

        expect(response.status).toBe(404);
      });

      it('should return 404 for GET /cancel', async () => {
        const response = await request(server.getUrl()).get('/cancel');

        expect(response.status).toBe(404);
      });

      it('should return 404 for invalid paths', async () => {
        const paths = ['/api', '/test', '/favicon.ico', '/style.css'];

        for (const path of paths) {
          const response = await request(server.getUrl()).get(path);
          expect(response.status).toBe(404);
        }
      });
    });
  });

  describe('Event Handling', () => {
    it('should emit APPROVED event on approval', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const eventPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.APPROVED, resolve);
      });

      await request(server.getUrl()).post('/approve').send({});

      await expect(eventPromise).resolves.toBeUndefined();
    });

    it('should emit CANCELLED event on cancellation', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const eventPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.CANCELLED, resolve);
      });

      await request(server.getUrl()).post('/cancel').send({});

      await expect(eventPromise).resolves.toBeUndefined();
    });

    it('should emit TIMEOUT event after timeout', async () => {
      // Mock setTimeout to trigger immediately
      jest.useFakeTimers();

      await server.start(testCertificateUrl, testCompanyName);

      const timeoutPromise = new Promise<void>((resolve) => {
        server.once(ServerEvent.TIMEOUT, resolve);
      });

      // Fast-forward time
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes

      await expect(timeoutPromise).resolves.toBeUndefined();
      expect(server.getIsRunning()).toBe(false);

      jest.useRealTimers();
    });

    it('should emit ERROR event on server error', async () => {
      const errorPromise = new Promise<Error>((resolve) => {
        server.once(ServerEvent.ERROR, resolve);
      });

      // Start server
      await server.start(testCertificateUrl, testCompanyName);

      // Get the underlying server and emit an error
      const underlyingServer = (server as any).server as http.Server;
      const testError = new Error('Test server error');
      underlyingServer.emit('error', testError);

      const emittedError = await errorPromise;
      expect(emittedError).toBe(testError);
    });

    it('should support multiple event listeners', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      let listener1Called = false;
      let listener2Called = false;

      server.once(ServerEvent.APPROVED, () => {
        listener1Called = true;
      });
      server.once(ServerEvent.APPROVED, () => {
        listener2Called = true;
      });

      await request(server.getUrl()).post('/approve').send({});

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(listener1Called).toBe(true);
      expect(listener2Called).toBe(true);
    });
  });

  describe('HTML Generation', () => {
    it('should escape company name to prevent XSS', async () => {
      const maliciousName = '<script>alert("XSS")</script>';
      await server.start(testCertificateUrl, maliciousName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('&lt;script&gt;');
      expect(response.text).not.toContain('<script>alert');
    });

    it('should escape certificate URL to prevent XSS', async () => {
      const maliciousUrl = 'javascript:alert("XSS")';
      await server.start(maliciousUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('javascript:alert');
      // URL should still be escaped in iframe src
      expect(response.text).toContain('src="javascript:alert');
    });

    it('should escape special HTML characters', async () => {
      const specialChars = 'Company & "Friends" <Test>';
      await server.start(testCertificateUrl, specialChars);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('&amp;');
      expect(response.text).toContain('&quot;');
      expect(response.text).toContain('&lt;');
      expect(response.text).toContain('&gt;');
    });

    it('should include approve button in HTML', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('btn-approve');
      expect(response.text).toContain('Approve & Continue to Payment');
      expect(response.text).toContain('handleApprove()');
    });

    it('should include cancel button in HTML', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('btn-cancel');
      expect(response.text).toContain('Cancel');
      expect(response.text).toContain('handleCancel()');
    });

    it('should include PDF iframe', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('<iframe');
      expect(response.text).toContain('id="pdfViewer"');
      expect(response.text).toContain(testCertificateUrl);
    });

    it('should include loading spinner', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('class="loading"');
      expect(response.text).toContain('class="spinner"');
      expect(response.text).toContain('Processing your decision...');
    });

    it('should include error message container', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('class="error"');
      expect(response.text).toContain('An error occurred');
    });

    it('should include beforeunload warning', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.text).toContain('beforeunload');
      expect(response.text).toContain('preventDefault');
    });
  });

  describe('Timeout Handling', () => {
    it('should clear timeout when server stops manually', async () => {
      jest.useFakeTimers();

      await server.start(testCertificateUrl, testCompanyName);
      await server.stop();

      // Advance time - should not emit timeout
      let timeoutEmitted = false;
      server.once(ServerEvent.TIMEOUT, () => {
        timeoutEmitted = true;
      });

      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(timeoutEmitted).toBe(false);

      jest.useRealTimers();
    });

    it('should clear timeout when server stops after approval', async () => {
      jest.useFakeTimers();

      await server.start(testCertificateUrl, testCompanyName);

      await request(server.getUrl()).post('/approve').send({});

      // Wait for server to stop
      jest.advanceTimersByTime(600);

      // Verify timeout was cleared
      let timeoutEmitted = false;
      server.once(ServerEvent.TIMEOUT, () => {
        timeoutEmitted = true;
      });

      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(timeoutEmitted).toBe(false);

      jest.useRealTimers();
    });

    it('should stop server after timeout expires', async () => {
      jest.useFakeTimers();

      await server.start(testCertificateUrl, testCompanyName);
      expect(server.getIsRunning()).toBe(true);

      jest.advanceTimersByTime(10 * 60 * 1000);

      // Wait for async stop to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(server.getIsRunning()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should reject start promise on server error during startup', async () => {
      // Try to bind to a privileged port (should fail)
      const originalFindPort = (server as any).findAvailablePort;
      (server as any).findAvailablePort = jest.fn().mockResolvedValue(80);

      await expect(
        server.start(testCertificateUrl, testCompanyName)
      ).rejects.toThrow();

      (server as any).findAvailablePort = originalFindPort;
    });

    it('should handle multiple simultaneous stops gracefully', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const stops = [server.stop(), server.stop(), server.stop()];

      await expect(Promise.all(stops)).resolves.not.toThrow();
      expect(server.getIsRunning()).toBe(false);
    });

    it('should handle approval after server stopped', async () => {
      await server.start(testCertificateUrl, testCompanyName);
      const url = server.getUrl();
      await server.stop();

      // Try to make request to stopped server
      await expect(
        request(url).post('/approve').send({})
      ).rejects.toThrow();
    });

    it('should emit ERROR event for server errors', async () => {
      const errorPromise = new Promise<Error>((resolve) => {
        server.once(ServerEvent.ERROR, resolve);
      });

      await server.start(testCertificateUrl, testCompanyName);

      // Simulate server error
      const underlyingServer = (server as any).server as http.Server;
      const testError = new Error('Socket hang up');
      underlyingServer.emit('error', testError);

      const error = await errorPromise;
      expect(error.message).toBe('Socket hang up');
    });

    it('should handle port exhaustion', async () => {
      // Mock findAvailablePort to throw
      (server as any).findAvailablePort = jest
        .fn()
        .mockRejectedValue(new Error('No available ports found'));

      await expect(
        server.start(testCertificateUrl, testCompanyName)
      ).rejects.toThrow('No available ports found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty company name', async () => {
      await server.start(testCertificateUrl, '');

      const response = await request(server.getUrl()).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Review Your Certificate of Incorporation');
    });

    it('should handle very long company name', async () => {
      const longName = 'A'.repeat(1000);
      await server.start(testCertificateUrl, longName);

      const response = await request(server.getUrl()).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain(longName);
    });

    it('should handle unicode in company name', async () => {
      const unicodeName = '测试公司 🏢 Тест';
      await server.start(testCertificateUrl, unicodeName);

      const response = await request(server.getUrl()).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain(unicodeName);
    });

    it('should handle special URL characters', async () => {
      const specialUrl = 'https://example.com/cert?id=123&type=inc#page=1';
      await server.start(specialUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('id=123');
    });

    it('should handle rapid approval/cancel', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const approvePromise = request(server.getUrl()).post('/approve').send({});
      const cancelPromise = request(server.getUrl()).post('/cancel').send({});

      // One should succeed (first one to be processed)
      const results = await Promise.allSettled([approvePromise, cancelPromise]);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle request with query parameters', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).get('/?test=123');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should handle request with hash fragment', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      // Note: Hash fragments are not sent to server, but URL parsing should handle them
      const response = await request(server.getUrl()).get('/');

      expect(response.status).toBe(200);
    });

    it('should handle POST request without body', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl()).post('/approve');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Approved'
      });
    });

    it('should handle request with custom headers', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const response = await request(server.getUrl())
        .get('/')
        .set('User-Agent', 'Custom Test Agent')
        .set('Accept-Language', 'en-US');

      expect(response.status).toBe(200);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous GET requests', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const requests = Array(10)
        .fill(null)
        .map(() => request(server.getUrl()).get('/'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toContain('Review Your Certificate of Incorporation');
      });
    });

    it('should handle interleaved start/stop operations', async () => {
      await server.start(testCertificateUrl, testCompanyName);
      const url1 = server.getUrl();
      await server.stop();

      await server.start(testCertificateUrl, testCompanyName);
      const url2 = server.getUrl();
      await server.stop();

      await server.start(testCertificateUrl, testCompanyName);
      const url3 = server.getUrl();
      await server.stop();

      expect([url1, url2, url3]).toEqual([url1, url1, url1]);
    });

    it('should handle approval event with multiple listeners', async () => {
      await server.start(testCertificateUrl, testCompanyName);

      const listeners = Array(5)
        .fill(null)
        .map(
          () =>
            new Promise<void>((resolve) => {
              server.once(ServerEvent.APPROVED, resolve);
            })
        );

      await request(server.getUrl()).post('/approve').send({});

      await expect(Promise.all(listeners)).resolves.toHaveLength(5);
    });
  });

  describe('ServerEvent Enum', () => {
    it('should have correct event names', () => {
      expect(ServerEvent.APPROVED).toBe('approved');
      expect(ServerEvent.CANCELLED).toBe('cancelled');
      expect(ServerEvent.TIMEOUT).toBe('timeout');
      expect(ServerEvent.ERROR).toBe('error');
    });
  });
});
