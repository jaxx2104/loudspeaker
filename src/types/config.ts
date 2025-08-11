export interface GitHubConfig {
  token: string;
  username: string;
}

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface OpenRouterConfig {
  apiKey: string;
}

export interface DeepSeekConfig {
  apiKey: string;
}

export interface MistralConfig {
  apiKey: string;
}

export interface Config {
  github: GitHubConfig;
  twitter: TwitterConfig;
  openrouter: OpenRouterConfig;
  deepseek: DeepSeekConfig;
  mistral: MistralConfig;
  systemPrompt: string;
}
