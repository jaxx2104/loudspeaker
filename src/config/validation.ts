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

export function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`Error: ${name} is not set in environment variables`);
    Deno.exit(1);
  }
  return value;
}

export function validateEnvironment(): void {
  for (const envVar of requiredEnvVars) {
    getEnvVar(envVar);
  }
}
