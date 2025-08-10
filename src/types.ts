// Configuration types
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

// GitHub API types
export interface PrimaryLanguage {
  name: string;
}

export interface ReadmeBlob {
  text: string;
}

export interface RepositoryNode {
  nameWithOwner: string;
  description: string | null;
  url: string;
  primaryLanguage: PrimaryLanguage | null;
  object: ReadmeBlob | null;
}

export interface StarEdge {
  node: RepositoryNode;
  starredAt: string;
}

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface StarredRepositories {
  edges: StarEdge[];
  pageInfo: PageInfo;
}

export interface GitHubUser {
  starredRepositories: StarredRepositories;
}

export interface GitHubResponse {
  user: GitHubUser;
}

// Application data types
export interface StarData {
  repo: string;
  description: string | null;
  url: string;
  primaryLanguage: string;
  readme: string;
  starredAt: Date;
}

// AI types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
}

export interface GenerateResult {
  text: string;
}

export type ModelType = 'openrouter' | 'deepseek' | 'mistral';
