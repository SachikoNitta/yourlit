import { AIProvider_Interface, AIRequestConfig } from '../types'

export class OpenAIProvider implements AIProvider_Interface {
  private readonly baseUrl = 'https://api.openai.com/v1/chat/completions'
  private readonly model = 'gpt-3.5-turbo'

  async generateText(
    prompt: string, 
    apiKey: string, 
    language: string,
    config: AIRequestConfig = {}
  ): Promise<string | null> {
    const { maxRetries = 3, timeout = 30000 } = config

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const systemPrompt = `You are a helpful AI assistant. Always respond in ${language}.`
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || null
      } catch (error) {
        console.error(`OpenAI attempt ${attempt}/${maxRetries} failed:`, error)
        
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
    const systemPrompt = `You are a creative story writer. Write engaging, well-structured stories. Always respond in ${language}.`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 60000)

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 3000,
          temperature: 0.8,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
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
    const systemPrompt = `You are a character extraction expert. Extract character information from stories and return ONLY valid JSON. Always respond in ${language}.`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent JSON output
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
}