import { AIProviderFactory } from './providers'
import { CharacterExtractionParams, ExtractedCharacterData } from './types'
import { getApiKey } from '../settings'

export class CharacterExtractionService {
  async extractCharacters(
    storyContent: string,
    params: CharacterExtractionParams
  ): Promise<ExtractedCharacterData[]> {
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
      console.warn('No API key available, cannot extract characters')
      return []
    }

    // Validate API key format
    if (!AIProviderFactory.isValidApiKey(params.aiProvider, apiKey)) {
      throw new Error(`Invalid API key format for ${params.aiProvider}`)
    }

    const extractionPrompt = this.buildCharacterExtractionPrompt(storyContent)

    console.log('🎭 Starting AI character extraction:', {
      storyLength: storyContent.length,
      aiProvider: params.aiProvider,
      hasApiKey: !!apiKey
    })

    try {
      const provider = AIProviderFactory.getProvider(params.aiProvider)
      
      const response = await provider.extractCharacters(
        extractionPrompt,
        apiKey,
        params.responseLanguage,
        { timeout: 30000, maxRetries: 3 }
      )

      if (response) {
        console.log('🤖 Raw AI response:', response.substring(0, 200) + '...')
        
        // Try to parse the JSON response
        const characters = this.parseAIResponse(response)
        
        console.log('✅ Extracted characters via AI:', {
          count: characters.length,
          names: characters.map(c => c.name)
        })
        
        return characters
      }
    } catch (error) {
      console.error('❌ AI character extraction failed:', error)
      return []
    }

    // No valid response
    return []
  }

  private buildCharacterExtractionPrompt(storyContent: string): string {
    return `Analyze the following story and extract all characters mentioned. For each character, provide:
1. Name
2. Brief description (2-3 sentences)
3. Key personality traits (up to 5)
4. Physical appearance (if mentioned)
5. Backstory or background (if mentioned)

Return the result as a JSON array where each character is an object with properties: name, description, traits (array), appearance (string or null), backstory (string or null).

Story to analyze:
${storyContent}

Respond with ONLY the JSON array, no other text.`
  }

  private parseAIResponse(response: string): ExtractedCharacterData[] {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = response.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(cleanedResponse)
      
      // Validate the structure
      if (Array.isArray(parsed)) {
        return parsed.map(char => ({
          name: char.name || 'Unknown',
          description: char.description || 'No description available',
          traits: Array.isArray(char.traits) ? char.traits : [],
          appearance: char.appearance || undefined,
          backstory: char.backstory || undefined
        })).filter(char => char.name !== 'Unknown')
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error)
      console.log('Response was:', response)
    }

    return []
  }

  async extractCharactersFromPrompt(
    prompt: string,
    params: CharacterExtractionParams
  ): Promise<ExtractedCharacterData[]> {
    const characterPrompt = `Create interesting characters based on this prompt: "${prompt}". Generate 2-4 characters with detailed descriptions, traits, appearance, and backstory.`
    
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
      throw new Error('No valid API key available for character generation')
    }

    if (!AIProviderFactory.isValidApiKey(params.aiProvider, apiKey)) {
      throw new Error(`Invalid API key format for ${params.aiProvider}`)
    }

    const provider = AIProviderFactory.getProvider(params.aiProvider)
    
    const fullPrompt = this.buildCharacterCreationPrompt(prompt)
    
    const response = await provider.extractCharacters(
      fullPrompt,
      apiKey,
      params.responseLanguage,
      { timeout: 30000, maxRetries: 3 }
    )

    if (!response) {
      throw new Error('Failed to generate characters')
    }

    return this.parseAIResponse(response)
  }

  private buildCharacterCreationPrompt(prompt: string): string {
    return `Based on this creative prompt: "${prompt}", create 2-4 interesting characters. For each character, provide:
1. Name
2. Brief description (2-3 sentences)
3. Key personality traits (up to 5)
4. Physical appearance
5. Backstory or background

Return the result as a JSON array where each character is an object with properties: name, description, traits (array), appearance (string), backstory (string).

Respond with ONLY the JSON array, no other text.`
  }
}

// Export singleton instance for backward compatibility
export const characterExtractionService = new CharacterExtractionService()