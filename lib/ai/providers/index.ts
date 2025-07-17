import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { AIProvider, AIProvider_Interface } from '../types'

export class AIProviderFactory {
  private static openaiProvider = new OpenAIProvider()
  private static geminiProvider = new GeminiProvider()

  static getProvider(provider: AIProvider): AIProvider_Interface {
    switch (provider) {
      case 'openai':
        return this.openaiProvider
      case 'gemini':
        return this.geminiProvider
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  }

  static isValidApiKey(provider: AIProvider, apiKey: string): boolean {
    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-')
      case 'gemini':
        return apiKey.startsWith('AI')
      default:
        return false
    }
  }

  static getAvailableProviders(): AIProvider[] {
    return ['openai', 'gemini']
  }
}

export { OpenAIProvider } from './openai'
export { GeminiProvider } from './gemini'