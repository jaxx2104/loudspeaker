// 環境変数の存在確認と取得
const requiredEnvVars = [
  'USER_GITHUB_TOKEN',
  'USER_GITHUB_NAME',
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_SECRET',
  'OPENROUTER_API_KEY',
  'MISTRAL_API_KEY',
  'DEEPSEEK_API_KEY',
  'SYSTEM_PROMPT',
];

// 環境変数の存在確認
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

// 環境変数のエクスポート
export const config = {
  github: {
    token: process.env.USER_GITHUB_TOKEN,
    username: process.env.USER_GITHUB_NAME,
  },
  twitter: {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  },
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  systemPrompt: process.env.SYSTEM_PROMPT,
};
