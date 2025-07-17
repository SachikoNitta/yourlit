// Shared AI types and interfaces

export type AIProvider = 'openai' | 'gemini'

export interface AIConfig {
  openaiKey: string
  geminiKey: string
  aiProvider: AIProvider
  responseLanguage: string
}

export interface BaseAIParams {
  openaiKey: string
  geminiKey: string
  aiProvider: AIProvider
  responseLanguage: string
}

// Story generation types
export interface StoryGenerationParams extends BaseAIParams {
  defaultNumAnswers: number
  defaultResponseLength: 'short' | 'medium' | 'long'
  storageType: 'localStorage' | 'firestore'
  firebaseApiKey: string
  firebaseProjectId: string
}

// Character extraction types
export interface CharacterExtractionParams extends BaseAIParams {}

export interface ExtractedCharacterData {
  name: string
  description: string
  traits: string[]
  appearance?: string
  backstory?: string
}

// Provider interface
export interface AIProvider_Interface {
  generateText(prompt: string, apiKey: string, language: string): Promise<string | null>
}

// Common AI responses
export interface AIResponse {
  content: string | null
  success: boolean
  error?: string
}

// API rate limiting and retry configuration
export interface AIRequestConfig {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}