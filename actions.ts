"use server"

import { LANGUAGES } from '@/lib/settings'

function getLanguageName(languageCode: string): string {
  const language = LANGUAGES.find(lang => lang.code === languageCode)
  return language?.name || 'English'
}

export async function generateAnswers(question: string, apiKey?: string, responseLanguage?: string, provider: 'openai' | 'gemini' = 'openai', count: number = 1, context?: string, responseLength: 'short' | 'medium' | 'long' = 'medium'): Promise<string[]> {
  // Define response length settings
  const lengthSettings = {
    short: { tokens: 50, description: 'Keep responses very brief and concise (1-2 sentences).' },
    medium: { tokens: 150, description: 'Keep responses concise and engaging (2-4 sentences).' },
    long: { tokens: 300, description: 'Provide detailed and elaborate responses (4-8 sentences).' }
  }
  
  const { tokens, description } = lengthSettings[responseLength]
  
  // Use OpenAI API if API key is provided
  if (apiKey && provider === 'openai' && apiKey.startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are helping to create an interactive story tree. Generate ${count} different, creative responses to continue the story. Each response should explore a different direction, tone, or perspective. ${description} ${question.toLowerCase().includes('continue') ? 'When continuing a story, write substantial narrative content with vivid details, dialogue, and plot development. Aim for rich, engaging prose that advances the story meaningfully.' : ''} Format your response as a numbered list (1., 2., 3., etc.).${responseLanguage && responseLanguage !== 'en' ? ` Always respond in ${getLanguageName(responseLanguage)}.` : ''}`,
            },
            {
              role: 'user',
              content: context ? `Context: ${context}

Question: ${question}` : question,
            },
          ],
          max_tokens: tokens * count,
          temperature: 0.9,
        }),
      })

      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status}`
        
        if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (response.status === 401) {
          errorMessage = "Invalid API key. Please check your OpenAI API key."
        } else if (response.status === 402) {
          errorMessage = "Insufficient credits. Please check your OpenAI account balance."
        } else if (response.status === 403) {
          errorMessage = "API access forbidden. Please check your OpenAI account permissions."
        }
        
        return [errorMessage]
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content?.trim()
      
      if (!content) return ["Error: No response from AI"]
      
      // Split the numbered list into individual responses
      const responses = content.split(/\d+\.\s*/).filter(r => r.trim().length > 0)
      return responses.length > 0 ? responses.map(r => r.trim()) : [content]
    } catch (error) {
      console.error('OpenAI API error:', error)
      if (error instanceof Error && error.message.includes('429')) {
        return ["Rate limit exceeded. Please wait a moment and try again."]
      }
      return ["Error: Failed to generate AI response"]
    }
  }

  // Use Gemini API if API key is provided
  if (apiKey && provider === 'gemini') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${context ? `Context: ${context}

` : ''}Question: ${question}

Generate ${count} different, creative responses to continue the story. Each response should explore a different direction, tone, or perspective. ${description} ${question.toLowerCase().includes('continue') ? 'When continuing a story, write substantial narrative content with vivid details, dialogue, and plot development. Aim for rich, engaging prose that advances the story meaningfully.' : ''} Format your response as a numbered list (1., 2., 3., etc.).${responseLanguage && responseLanguage !== 'en' ? ` Always respond in ${getLanguageName(responseLanguage)}.` : ''}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: tokens * count,
            temperature: 0.9,
          },
        }),
      })

      if (!response.ok) {
        let errorMessage = `Gemini API error: ${response.status}`
        
        if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (response.status === 400) {
          errorMessage = "Invalid API key or request. Please check your Gemini API key."
        } else if (response.status === 403) {
          errorMessage = "API access forbidden. Please check your Gemini API key permissions."
        }
        
        return [errorMessage]
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      
      if (!content) return ["Error: No response from Gemini"]
      
      // Split the numbered list into individual responses
      const responses = content.split(/\d+\.\s*/).filter(r => r.trim().length > 0)
      return responses.length > 0 ? responses.map(r => r.trim()) : [content]
    } catch (error) {
      console.error('Gemini API error:', error)
      return ["Error: Failed to generate Gemini response"]
    }
  }

  // Fallback to test answers when no API key
  return Array.from({length: count}, (_, i) => `Test answer ${i + 1} - This is a different response path exploring various possibilities.`)
}

export async function generateStoryVersion(
  originalStory: string, 
  instructions: string, 
  apiKey?: string, 
  responseLanguage?: string, 
  provider: 'openai' | 'gemini' = 'openai'
): Promise<string> {
  // Use a generous token limit and let the AI follow the user's instructions
  const tokens = 3000
  
  // Use OpenAI API if API key is provided
  if (apiKey && provider === 'openai' && apiKey.startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a skilled story editor and rewriter. You will receive a story and specific instructions on how to transform it. Follow the instructions carefully while maintaining narrative coherence and quality. Write engaging, well-crafted prose.${responseLanguage && responseLanguage !== 'en' ? ` Always respond in ${getLanguageName(responseLanguage)}.` : ''}`,
            },
            {
              role: 'user',
              content: `Instructions: ${instructions}

Original Story:
${originalStory}

Please rewrite this story following the instructions above.`,
            },
          ],
          max_tokens: tokens,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status}`
        
        if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (response.status === 401) {
          errorMessage = "Invalid API key. Please check your OpenAI API key."
        } else if (response.status === 402) {
          errorMessage = "Insufficient credits. Please check your OpenAI account balance."
        } else if (response.status === 403) {
          errorMessage = "API access forbidden. Please check your OpenAI account permissions."
        }
        
        return errorMessage
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content?.trim()
      
      return content || "Error: No response from AI"
    } catch (error) {
      console.error('OpenAI API error:', error)
      if (error instanceof Error && error.message.includes('429')) {
        return "Rate limit exceeded. Please wait a moment and try again."
      }
      return "Error: Failed to generate AI response"
    }
  }

  // Use Gemini API if API key is provided
  if (apiKey && provider === 'gemini') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a skilled story editor and rewriter. You will receive a story and specific instructions on how to transform it. Follow the instructions carefully while maintaining narrative coherence and quality. Write engaging, well-crafted prose.${responseLanguage && responseLanguage !== 'en' ? ` Always respond in ${getLanguageName(responseLanguage)}.` : ''}

Instructions: ${instructions}

Original Story:
${originalStory}

Please rewrite this story following the instructions above.`
            }]
          }],
          generationConfig: {
            maxOutputTokens: tokens,
            temperature: 0.8,
          },
        }),
      })

      if (!response.ok) {
        let errorMessage = `Gemini API error: ${response.status}`
        
        if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (response.status === 400) {
          errorMessage = "Invalid API key or request. Please check your Gemini API key."
        } else if (response.status === 403) {
          errorMessage = "API access forbidden. Please check your Gemini API key permissions."
        }
        
        return errorMessage
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      
      return content || "Error: No response from Gemini"
    } catch (error) {
      console.error('Gemini API error:', error)
      return "Error: Failed to generate Gemini response"
    }
  }

  // Fallback to test response when no API key
  return `Test rewritten story: Following instructions "${instructions}", here is a rewritten version of the original story with the requested changes applied.`
}
