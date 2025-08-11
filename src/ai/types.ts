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
