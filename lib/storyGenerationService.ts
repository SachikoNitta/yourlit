import { generateStoryVersion } from '../actions'
import { getApiKey } from './settings'
import { StoryVersion, Draft } from './draftsStorage'

export interface GenerationParams {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
}

export const storyGenerationService = {
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
    })

    console.log('🎨 Starting story version generation:', {
      instructions: instructions.trim(),
      originalStoryLength: draft.content.length,
      aiProvider: params.aiProvider,
      hasApiKey: !!apiKey
    })

    const generatedContent = await generateStoryVersion(
      draft.content,
      instructions.trim(),
      apiKey,
      params.responseLanguage,
      params.aiProvider
    )

    console.log('✅ Generated story version:', {
      originalLength: draft.content.length,
      newLength: generatedContent.length,
      preview: generatedContent.substring(0, 100) + '...'
    })

    return {
      id: `story-${Date.now()}`,
      title: draft.title,
      content: generatedContent.trim(),
      prompt: instructions.trim(),
      originalDraftId: draft.id,
      createdAt: new Date().toISOString()
    }
  }
}