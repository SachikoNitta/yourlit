import { AIProvider_Interface, AIRequestConfig } from '../types'

export class GeminiProvider implements AIProvider_Interface {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

  async generateText(
    prompt: string, 
    apiKey: string, 
    language: string,
    config: AIRequestConfig = {}
  ): Promise<string | null> {
    const { maxRetries = 3, timeout = 30000 } = config

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const systemInstruction = `You are a helpful AI assistant. Always respond in ${language}.`
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
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
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 2000,
            },
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null
      } catch (error) {
        console.error(`Gemini attempt ${attempt}/${maxRetries} failed:`, error)
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    return null
  }

  async generateStoryText(
    prompt: string,
    apiKey: string,
    language: string,
    config: AIRequestConfig = {}
  ): Promise<string | null> {
    const systemInstruction = `You are a creative story writer. Write engaging, well-structured stories. Always respond in ${language}.`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 60000)

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
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
            temperature: 0.8,
            topK: 1,
            topP: 1,
            maxOutputTokens: 3000,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async extractCharacters(
    prompt: string,
    apiKey: string,
    language: string,
    config: AIRequestConfig = {}
  ): Promise<string | null> {
    const systemInstruction = `You are a character extraction expert. Extract character information from stories and return ONLY valid JSON. Always respond in ${language}.`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
}