import { getApiKey } from './settings'

export interface CharacterExtractionParams {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
}

interface ExtractedCharacterData {
  name: string
  description: string
  traits: string[]
  appearance?: string
  backstory?: string
}

export const characterExtractionService = {
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

    const extractionPrompt = `Analyze the following story and extract all characters mentioned. For each character, provide:
1. Name
2. Brief description (2-3 sentences)
3. Key personality traits (up to 5)
4. Physical appearance (if mentioned)
5. Backstory or background (if mentioned)

Return the result as a JSON array where each character is an object with properties: name, description, traits (array), appearance (string or null), backstory (string or null).

Story to analyze:
${storyContent}

Respond with ONLY the JSON array, no other text.`

    console.log('🎭 Starting AI character extraction:', {
      storyLength: storyContent.length,
      aiProvider: params.aiProvider,
      hasApiKey: !!apiKey
    })

    try {
      const response = await this.callCharacterExtractionAPI(
        extractionPrompt,
        apiKey,
        params.aiProvider,
        params.responseLanguage
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
  },

  async callCharacterExtractionAPI(
    prompt: string,
    apiKey: string,
    provider: 'openai' | 'gemini',
    language: string
  ): Promise<string | null> {
    if (provider === 'openai' && apiKey.startsWith('sk-')) {
      return await this.callOpenAIForCharacterExtraction(prompt, apiKey, language)
    } else if (provider === 'gemini' && apiKey.startsWith('AI')) {
      return await this.callGeminiForCharacterExtraction(prompt, apiKey, language)
    }
    
    throw new Error(`Unsupported AI provider: ${provider}`)
  },

  async callOpenAIForCharacterExtraction(
    prompt: string,
    apiKey: string,
    language: string
  ): Promise<string | null> {
    const systemPrompt = `You are a character extraction expert. Extract character information from stories and return ONLY valid JSON. Always respond in ${language}.`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent JSON output
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  },

  async callGeminiForCharacterExtraction(
    prompt: string,
    apiKey: string,
    language: string
  ): Promise<string | null> {
    const systemInstruction = `You are a character extraction expert. Extract character information from stories and return ONLY valid JSON. Always respond in ${language}.`
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemInstruction}\n\n${prompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2000,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null
  },

  parseAIResponse(response: string): ExtractedCharacterData[] {
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
}