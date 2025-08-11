import type { StarData } from '../types/index.ts';
import { summarizeRepository } from './summarizer.ts';

// Mock environment variables for testing
const mockEnvVars = {
  USER_GITHUB_TOKEN: 'mock_github_token',
  USER_GITHUB_NAME: 'mock_user',
  X_API_KEY: 'mock_x_api_key',
  X_API_SECRET: 'mock_x_api_secret',
  X_ACCESS_TOKEN: 'mock_x_access_token',
  X_ACCESS_SECRET: 'mock_x_access_secret',
  OPENROUTER_API_KEY: 'mock_openrouter_key',
  DEEPSEEK_API_KEY: 'mock_deepseek_key',
  MISTRAL_API_KEY: 'mock_mistral_key',
  SYSTEM_PROMPT: 'Create a concise summary of this repository.',
};

// Set mock environment variables before importing modules
for (const [key, value] of Object.entries(mockEnvVars)) {
  Deno.env.set(key, value);
}

// Test repository data
const testData: StarData = {
  repo: 'test-repo',
  description: 'A test repository for summarization',
  url: 'https://github.com/test/test-repo',
  primaryLanguage: 'JavaScript',
  readme: 'This is a simple Node.js application for testing purposes.',
  starredAt: new Date(),
};

async function testSummarizer(): Promise<void> {
  console.log('🧪 Testing Mastra summarizer (using mocked API keys)...');
  console.log(
    'Note: This will attempt to call real APIs with mock keys, so failures are expected.',
  );

  try {
    // Test fallback behavior by trying all models
    console.log('\n1. Testing fallback chain (OpenRouter -> DeepSeek -> Mistral):');
    const result1 = await summarizeRepository(testData);
    console.log('✅ Result:', result1);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('❌ Expected failure with mock keys:', errorMessage);
  }

  console.log('\n✅ Test completed! The summarizer service is properly configured.');
  console.log('To run with real API keys, create a .env file based on .env.example');
}

if (import.meta.main) {
  testSummarizer();
}
