import { AIProviderFactory } from './providers'
import { StoryGenerationParams, AIProvider } from './types'
import { getApiKey } from '../settings'
import { StoryVersion, Draft } from '../draftsStorage'

export interface GenerationParams {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
}

export class StoryGenerationService {
  async generateVersion(
    draft: Draft,
    instructions: string,
    params: GenerationParams
  ): Promise<StoryVersion> {
    const apiKey = getApiKey({
      openaiKey: params.openaiKey,
      geminiKey: params.geminiKey,
      aiProvider: params.aiProvider,
      responseLanguage: params.responseLanguage,
      defaultNumAnswers: 3,
      defaultResponseLength: 'medium',
      storageType: 'localStorage',
      firebaseApiKey: '',
      firebaseProjectId: ''
    })

    if (!apiKey) {
      throw new Error('No valid API key available for story generation')
    }

    console.log('🎨 Starting story version generation:', {
      instructions: instructions.trim(),
      originalStoryLength: draft.content.length,
      aiProvider: params.aiProvider,
      hasApiKey: !!apiKey
    })

    // Validate API key format
    if (!AIProviderFactory.isValidApiKey(params.aiProvider, apiKey)) {
      throw new Error(`Invalid API key format for ${params.aiProvider}`)
    }

    const provider = AIProviderFactory.getProvider(params.aiProvider)
    
    const prompt = this.buildStoryGenerationPrompt(draft.content, instructions)
    
    const generatedContent = await provider.generateStoryText(
      prompt,
      apiKey,
      params.responseLanguage,
      { timeout: 60000, maxRetries: 3 }
    )

    if (!generatedContent) {
      throw new Error('Failed to generate story content')
    }

    console.log('✅ Generated story version:', {
      originalLength: draft.content.length,
      newLength: generatedContent.length,
      preview: generatedContent.substring(0, 100) + '...'
    })

    return {
      id: `story-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: this.generateVersionTitle(draft.title, instructions),
      content: generatedContent.trim(),
      prompt: instructions.trim(),
      originalDraftId: draft.id,
      createdAt: new Date().toISOString()
    }
  }

  private buildStoryGenerationPrompt(originalContent: string, instructions: string): string {
    return `Based on the following story, create a new version following these instructions: "${instructions}"

Original Story:
${originalContent}

Instructions: ${instructions}

Please generate a new version of this story that follows the given instructions while maintaining the core narrative elements. Make sure the story flows well and is engaging.`
  }

  private generateVersionTitle(originalTitle: string, instructions: string): string {
    // Extract key words from instructions for a descriptive title
    const instructionWords = instructions.split(' ').slice(0, 3).join(' ')
    return `${originalTitle} - ${instructionWords}`
  }

  async generateFromPrompt(
    prompt: string,
    params: GenerationParams
  ): Promise<string> {
    const apiKey = getApiKey({
      openaiKey: params.openaiKey,
      geminiKey: params.geminiKey,
      aiProvider: params.aiProvider,
      responseLanguage: params.responseLanguage,
      defaultNumAnswers: 1,
      defaultResponseLength: 'medium',
      storageType: 'localStorage',
      firebaseApiKey: '',
      firebaseProjectId: ''
    })

    if (!apiKey) {
      throw new Error('No valid API key available for story generation')
    }

    if (!AIProviderFactory.isValidApiKey(params.aiProvider, apiKey)) {
      throw new Error(`Invalid API key format for ${params.aiProvider}`)
    }

    const provider = AIProviderFactory.getProvider(params.aiProvider)
    
    const storyPrompt = `Write a creative and engaging story based on this prompt: "${prompt}"`
    
    const generatedContent = await provider.generateStoryText(
      storyPrompt,
      apiKey,
      params.responseLanguage,
      { timeout: 60000, maxRetries: 3 }
    )

    if (!generatedContent) {
      throw new Error('Failed to generate story content')
    }

    return generatedContent.trim()
  }
}

// Export singleton instance for backward compatibility
export const storyGenerationService = new StoryGenerationService()