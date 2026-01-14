/**
 * Unit Tests - Name Check Agent
 * Tests the name availability checking service
 */

import {
  mockNameCheckAgent,
  NameCheckResponse,
} from '../../mocks/agent-api.mock';

describe('Name Check Agent', () => {
  beforeEach(() => {
    mockNameCheckAgent.reset();
  });

  describe('checkNameAvailability', () => {
    it('should return available for unique company names', async () => {
      const result = await mockNameCheckAgent.checkNameAvailability(
        'Unique Startup LLC',
        'Delaware'
      );

      expect(result.available).toBe(true);
      expect(result.companyName).toBe('Unique Startup LLC');
      expect(result.state).toBe('Delaware');
      expect(result.alternatives).toEqual([]);
      expect(result.checkedAt).toBeDefined();
    });

    it('should return unavailable for taken company names', async () => {
      const result = await mockNameCheckAgent.checkNameAvailability(
        'Acme LLC',
        'Delaware'
      );

      expect(result.available).toBe(false);
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives!.length).toBeGreaterThan(0);
    });

    it('should provide alternative names when name is taken', async () => {
      const result = await mockNameCheckAgent.checkNameAvailability(
        'Test Company LLC',
        'Delaware'
      );

      expect(result.available).toBe(false);
      expect(result.alternatives).toContain('Test Company LLC Holdings');
      expect(result.alternatives).toContain('Test Company LLC Group');
      expect(result.alternatives).toContain('Test Company LLC Ventures');
    });

    it('should complete check within 5 seconds (FR-015)', async () => {
      const startTime = Date.now();

      await mockNameCheckAgent.checkNameAvailability(
        'Performance Test LLC',
        'Delaware'
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should handle special characters in company names', async () => {
      const specialNames = [
        "O'Reilly & Associates LLC",
        'Café Société LLC',
        'Tech-Solutions LLC',
      ];

      for (const name of specialNames) {
        const result = await mockNameCheckAgent.checkNameAvailability(
          name,
          'Delaware'
        );
        expect(result.companyName).toBe(name);
        expect(result.available).toBeDefined();
      }
    });

    it('should be case-sensitive for name checking', async () => {
      mockNameCheckAgent.addTakenName('ACME LLC');

      const lowerCase = await mockNameCheckAgent.checkNameAvailability(
        'acme llc',
        'Delaware'
      );
      const upperCase = await mockNameCheckAgent.checkNameAvailability(
        'ACME LLC',
        'Delaware'
      );

      expect(lowerCase.available).toBe(true);
      expect(upperCase.available).toBe(false);
    });

    it('should include timestamp in ISO format', async () => {
      const result = await mockNameCheckAgent.checkNameAvailability(
        'Timestamp Test LLC',
        'Delaware'
      );

      expect(result.checkedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long company names', async () => {
      const longName = 'A'.repeat(255) + ' LLC';

      const result = await mockNameCheckAgent.checkNameAvailability(
        longName,
        'Delaware'
      );

      expect(result.companyName).toBe(longName);
      expect(result.available).toBeDefined();
    });

    it('should handle concurrent name checks', async () => {
      const names = [
        'Concurrent Test 1 LLC',
        'Concurrent Test 2 LLC',
        'Concurrent Test 3 LLC',
        'Concurrent Test 4 LLC',
        'Concurrent Test 5 LLC',
      ];

      const promises = names.map((name) =>
        mockNameCheckAgent.checkNameAvailability(name, 'Delaware')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.companyName).toBe(names[index]);
      });
    });

    it('should handle names with unicode characters', async () => {
      const unicodeNames = [
        'Société Générale LLC',
        'München Holdings LLC',
        'Москва Ventures LLC',
      ];

      for (const name of unicodeNames) {
        const result = await mockNameCheckAgent.checkNameAvailability(
          name,
          'Delaware'
        );
        expect(result.companyName).toBe(name);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle empty company names gracefully', async () => {
      await expect(
        mockNameCheckAgent.checkNameAvailability('', 'Delaware')
      ).resolves.toBeDefined();
    });

    it('should handle empty state values gracefully', async () => {
      await expect(
        mockNameCheckAgent.checkNameAvailability('Test LLC', '')
      ).resolves.toBeDefined();
    });
  });
});
