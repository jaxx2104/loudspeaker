import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
import type { Config } from '../types.ts';

// Load .env file
await load({ export: true });

// Required environment variables
const requiredEnvVars = [
  'USER_GITHUB_TOKEN',
  'USER_GITHUB_NAME',
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_SECRET',
  'OPENROUTER_API_KEY',
  'DEEPSEEK_API_KEY',
  'MISTRAL_API_KEY',
  'SYSTEM_PROMPT',
] as const;

function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`Error: ${name} is not set in environment variables`);
    Deno.exit(1);
  }
  return value;
}

// Validate all required environment variables exist
for (const envVar of requiredEnvVars) {
  getEnvVar(envVar);
}

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
