import { OpenAIProvider } from "./providers/openai"
import { GeminiProvider } from "./providers/gemini"
import { EmotionStep } from "../emotionCodes"

export interface EmotionExpansionParams {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
}

export const emotionExpansionService = {
  async generateEmotionCodeFromStory(
    storyTitle: string,
    storyContent: string,
    params: EmotionExpansionParams
  ): Promise<{ name: string; steps: EmotionStep[]; tags: string[] }> {
    const systemPrompt = `You are an emotion analysis expert that analyzes stories to extract emotional progression patterns. Based on the provided story, identify the emotional flow and create an emotion code that represents the story's emotional journey. Return your response in this exact JSON format:

{
  "name": "Descriptive name for the emotion pattern",
  "steps": [
    { "tone": "emotion_tone", "label": "Japanese emotion label", "duration": number_1_to_5 },
    { "tone": "emotion_tone", "label": "Japanese emotion label", "duration": number_1_to_5 }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

IMPORTANT REQUIREMENTS:
- Analyze the story's emotional progression from beginning to end
- Create 3-8 emotion steps that capture the key emotional beats
- Use these available emotion tones: calm, thrill, tension, emotional, dark, hope, triumph, curiosity, sweet, light, funny, chaos, revelation, melancholy, excitement, peaceful, nostalgic, mysterious
- Provide Japanese labels (感情ラベル) that describe the specific emotion in context
- Duration should be 1-5, representing the relative length/importance of each emotional beat
- The name should be evocative and capture the overall emotional pattern
- Tags should describe the emotion pattern type (e.g., "adventure", "romance", "mystery", "comedy", "tragedy", "growth", "conflict", "resolution")
- Focus on the emotional journey, not just plot events
- Consider character emotions, story atmosphere, and reader emotional experience

Story Title: "${storyTitle}"

Story Content: "${storyContent}"`

    try {
      const apiKey = params.aiProvider === 'openai' ? params.openaiKey : params.geminiKey
      
      if (!apiKey) {
        throw new Error(`No API key provided for ${params.aiProvider}`)
      }

      let result: string | null = null

      if (params.aiProvider === 'openai') {
        const provider = new OpenAIProvider()
        result = await provider.generateText(systemPrompt, apiKey, params.responseLanguage, {
          timeout: 60000,
          maxRetries: 3
        })
      } else {
        const provider = new GeminiProvider()
        result = await provider.generateText(systemPrompt, apiKey, params.responseLanguage, {
          timeout: 60000,
          maxRetries: 3
        })
      }

      if (!result) {
        throw new Error('No result from AI provider')
      }
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(result)
        return parsed
      } catch (parseError) {
        // If JSON parsing fails, create a structured response based on story
        const storyExcerpt = result.substring(0, 200).replace(/[^\w\s.,!?-]/g, ' ').trim()
        return {
          name: `${storyTitle} Emotion Flow`,
          steps: [
            { tone: "calm", label: "始まり", duration: 1 },
            { tone: "curiosity", label: "展開", duration: 2 },
            { tone: "tension", label: "クライマックス", duration: 2 },
            { tone: "emotional", label: "結末", duration: 1 }
          ],
          tags: ["story-based", "narrative", "extracted"]
        }
      }
    } catch (error) {
      console.error('Error generating emotion code from story:', error)
      throw error
    }
  },

  async enhanceEmotionCode(
    existingSteps: EmotionStep[],
    focusArea: string,
    params: EmotionExpansionParams
  ): Promise<EmotionStep[]> {
    const currentStepsText = existingSteps.map(step => 
      `${step.tone} (${step.label}) - duration: ${step.duration}`
    ).join(', ')

    const prompt = `You are an emotion pattern specialist. The user has an existing emotion code and wants to enhance or modify it in a specific way.

Current emotion steps: ${currentStepsText}

Enhancement request: "${focusArea}"

Please provide an improved version of the emotion steps that incorporates the requested enhancement. Return only a JSON array of emotion steps in this format:
[
  { "tone": "emotion_tone", "label": "Japanese label", "duration": number_1_to_5 }
]

Use these available tones: calm, thrill, tension, emotional, dark, hope, triumph, curiosity, sweet, light, funny, chaos, revelation, melancholy, excitement, peaceful, nostalgic, mysterious

Consider:
- The original emotional flow structure
- How to incorporate the enhancement naturally
- Maintaining good emotional pacing
- Japanese labels that fit the context`

    try {
      const apiKey = params.aiProvider === 'openai' ? params.openaiKey : params.geminiKey
      
      if (!apiKey) {
        throw new Error(`No API key provided for ${params.aiProvider}`)
      }

      let result: string | null = null

      if (params.aiProvider === 'openai') {
        const provider = new OpenAIProvider()
        result = await provider.generateText(prompt, apiKey, params.responseLanguage, {
          timeout: 60000,
          maxRetries: 3
        })
      } else {
        const provider = new GeminiProvider()
        result = await provider.generateText(prompt, apiKey, params.responseLanguage, {
          timeout: 60000,
          maxRetries: 3
        })
      }

      if (!result) {
        throw new Error('No result from AI provider')
      }
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : existingSteps
      } catch (parseError) {
        // If JSON parsing fails, return original steps
        return existingSteps
      }
    } catch (error) {
      console.error('Error enhancing emotion code:', error)
      return existingSteps
    }
  },

  async generateEmotionCodeFromPrompt(
    prompt: string,
    params: EmotionExpansionParams
  ): Promise<{ name: string; steps: EmotionStep[]; tags: string[] }> {
    const systemPrompt = `You are a creative emotion pattern designer. Based on the user's prompt, create an emotion code that represents the requested emotional journey. Return your response in this exact JSON format:

{
  "name": "Descriptive name for the emotion pattern",
  "steps": [
    { "tone": "emotion_tone", "label": "Japanese emotion label", "duration": number_1_to_5 }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Use these available emotion tones: calm, thrill, tension, emotional, dark, hope, triumph, curiosity, sweet, light, funny, chaos, revelation, melancholy, excitement, peaceful, nostalgic, mysterious

Create an engaging emotional progression with 3-8 steps. Duration should be 1-5 representing relative importance/length.

User prompt: "${prompt}"`

    try {
      const apiKey = params.aiProvider === 'openai' ? params.openaiKey : params.geminiKey
      
      if (!apiKey) {
        throw new Error(`No API key provided for ${params.aiProvider}`)
      }

      let result: string | null = null

      if (params.aiProvider === 'openai') {
        const provider = new OpenAIProvider()
        result = await provider.generateText(systemPrompt, apiKey, params.responseLanguage, {
          timeout: 60000,
          maxRetries: 3
        })
      } else {
        const provider = new GeminiProvider()
        result = await provider.generateText(systemPrompt, apiKey, params.responseLanguage, {
          timeout: 60000,
          maxRetries: 3
        })
      }

      if (!result) {
        throw new Error('No result from AI provider')
      }
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(result)
        return parsed
      } catch (parseError) {
        // If JSON parsing fails, create a default pattern
        return {
          name: "Generated Emotion Pattern",
          steps: [
            { tone: "calm", label: "始まり", duration: 1 },
            { tone: "curiosity", label: "展開", duration: 2 },
            { tone: "tension", label: "盛り上がり", duration: 2 },
            { tone: "emotional", label: "結末", duration: 1 }
          ],
          tags: ["generated", "custom", "ai"]
        }
      }
    } catch (error) {
      console.error('Error generating emotion code from prompt:', error)
      throw error
    }
  }
}