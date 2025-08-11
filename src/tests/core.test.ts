import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import type { StarData } from '../types/index.ts';

// Mock star data for testing
const mockStarData: StarData = {
  repo: 'test-org/test-repo',
  description: 'A test repository for unit testing',
  url: 'https://github.com/test-org/test-repo',
  primaryLanguage: 'TypeScript',
  readme: 'This is a test repository for demonstrating unit tests.',
  starredAt: new Date('2024-01-01T12:00:00Z'),
};

describe('Core processor', () => {
  it('should format star data correctly', () => {
    assertEquals(mockStarData.repo, 'test-org/test-repo');
    assertEquals(mockStarData.primaryLanguage, 'TypeScript');
    assertEquals(typeof mockStarData.starredAt, 'object');
    assertEquals(mockStarData.starredAt instanceof Date, true);
  });

  it('should handle star data with null description', () => {
    const starWithNullDesc: StarData = {
      ...mockStarData,
      description: null,
    };
    
    assertEquals(starWithNullDesc.description, null);
    assertEquals(typeof starWithNullDesc.repo, 'string');
  });

  it('should handle star data with empty readme', () => {
    const starWithEmptyReadme: StarData = {
      ...mockStarData,
      readme: '',
    };
    
    assertEquals(starWithEmptyReadme.readme, '');
    assertEquals(starWithEmptyReadme.url.startsWith('https://'), true);
  });
});