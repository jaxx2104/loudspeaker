import 'dotenv/config';
import { summarizeRepository } from './src/services/summarizer.js';

// テスト用のリポジトリデータ
const testData = {
  repo: "test-repo",
  primaryLanguage: "JavaScript",
  readme: "This is a simple Node.js application for testing purposes."
};

async function testSummarizer() {
  try {
    console.log('Testing Mastra summarizer with fallback order: OpenRouter -> DeepSeek -> Mistral...');
    
    // デフォルト（OpenRouter）でテスト
    console.log('\n1. Testing with OpenRouter (default):');
    const result1 = await summarizeRepository(testData);
    console.log('Result:', result1);
    
    // DeepSeekでテスト
    console.log('\n2. Testing with DeepSeek:');
    const result2 = await summarizeRepository(testData, 'deepseek');
    console.log('Result:', result2);
    
    // Mistralでテスト
    console.log('\n3. Testing with Mistral:');
    const result3 = await summarizeRepository(testData, 'mistral');
    console.log('Result:', result3);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSummarizer();