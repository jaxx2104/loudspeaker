import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
import type { Config } from '../types/index.ts';
import { getEnvVar, validateEnvironment } from './validation.ts';

// Load .env file
await load({ export: true });

// Validate all required environment variables exist
validateEnvironment();

// Export typed configuration object
export const config: Config = {
  github: {
    token: getEnvVar('USER_GITHUB_TOKEN'),
    username: getEnvVar('USER_GITHUB_NAME'),
  },
  twitter: {
    apiKey: getEnvVar('X_API_KEY'),
    apiSecret: getEnvVar('X_API_SECRET'),
    accessToken: getEnvVar('X_ACCESS_TOKEN'),
    accessSecret: getEnvVar('X_ACCESS_SECRET'),
  },
  openrouter: {
    apiKey: getEnvVar('OPENROUTER_API_KEY'),
  },
  deepseek: {
    apiKey: getEnvVar('DEEPSEEK_API_KEY'),
  },
  mistral: {
    apiKey: getEnvVar('MISTRAL_API_KEY'),
  },
  systemPrompt: getEnvVar('SYSTEM_PROMPT'),
};
