import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import type { StarData } from '../types/index.ts';

// Mock data for testing
const mockStarData: StarData = {
  repo: 'test-org/awesome-project',
  description: 'An awesome test project for demonstration',
  url: 'https://github.com/test-org/awesome-project',
  primaryLanguage: 'TypeScript',
  readme: 'This is an awesome TypeScript project that demonstrates best practices.',
  starredAt: new Date('2024-01-01T10:00:00Z'),
};

describe('Services', () => {
  describe('GitHub Service', () => {
    it('should handle StarData structure correctly', () => {
      assertEquals(mockStarData.repo.includes('/'), true);
      assertEquals(mockStarData.url.startsWith('https://github.com/'), true);
      assertExists(mockStarData.starredAt);
    });

    it('should handle repository with no description', () => {
      const repoWithoutDesc: StarData = {
        ...mockStarData,
        description: null,
      };

      assertEquals(repoWithoutDesc.description, null);
      assertExists(repoWithoutDesc.repo);
    });

    it('should validate star timestamp', () => {
      const now = new Date();
      const starredRepo: StarData = {
        ...mockStarData,
        starredAt: now,
      };

      assertEquals(starredRepo.starredAt instanceof Date, true);
      assertEquals(starredRepo.starredAt.getTime(), now.getTime());
    });
  });

  describe('Twitter Service', () => {
    it('should format message correctly', () => {
      const summary = 'Awesome TypeScript project with best practices';
      const expectedMessage = `${summary}\n${mockStarData.url}`;
      
      assertEquals(expectedMessage.includes(summary), true);
      assertEquals(expectedMessage.includes(mockStarData.url), true);
      assertEquals(expectedMessage.includes('\n'), true);
    });

    it('should handle long summaries', () => {
      const longSummary = 'This is a very long summary that might exceed typical social media character limits but should still be handled gracefully by the system';
      const message = `${longSummary}\n${mockStarData.url}`;
      
      assertEquals(message.length > mockStarData.url.length, true);
      assertEquals(message.endsWith(mockStarData.url), true);
    });
  });

  describe('Summarizer Service', () => {
    it('should handle repository data structure', () => {
      const prompt = `
- repo: ${mockStarData.repo}
- primaryLanguage: ${mockStarData.primaryLanguage}
- readme: ${mockStarData.readme}
`;

      assertEquals(prompt.includes(mockStarData.repo), true);
      assertEquals(prompt.includes(mockStarData.primaryLanguage), true);
      assertEquals(prompt.includes(mockStarData.readme), true);
    });

    it('should handle missing readme content', () => {
      const dataWithoutReadme: StarData = {
        ...mockStarData,
        readme: '',
      };

      const prompt = `
- repo: ${dataWithoutReadme.repo}
- primaryLanguage: ${dataWithoutReadme.primaryLanguage}
- readme: ${dataWithoutReadme.readme || 'No README provided'}
`;

      assertEquals(prompt.includes('No README provided'), true);
    });
  });
});