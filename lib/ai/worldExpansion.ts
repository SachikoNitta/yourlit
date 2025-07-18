import { OpenAIProvider } from "./providers/openai"
import { GeminiProvider } from "./providers/gemini"

export interface WorldExpansionParams {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
}

export const worldExpansionService = {
  async generateWorldFromStory(
    storyTitle: string,
    storyContent: string,
    params: WorldExpansionParams
  ): Promise<{ name: string; description: string; genre: string; tags: string[]; details: any }> {
    const systemPrompt = `You are a world-building expert that analyzes stories to extract world setting information. Based on the provided story, identify and extract the world setting details. Return your response in this exact JSON format:

{
  "name": "World Name (based on the story setting)",
  "description": "Brief 1-2 sentence description of the world",
  "genre": "Genre of the world (e.g., Fantasy, Sci-Fi, Modern, etc.)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "details": {
    "timePeriod": "Time period or era mentioned or implied",
    "location": "Setting location(s) described in the story",
    "technology": "Technology level and tools mentioned",
    "magic": "Magic system described or 'None' if no magic",
    "politics": "Political structure, governance, or social systems",
    "culture": "Cultural aspects, society, customs mentioned",
    "climate": "Climate, environment, or weather described",
    "creatures": "Notable creatures, beings, or characters mentioned",
    "rules": "World rules, laws, or unique mechanics",
    "conflicts": "Conflicts, tensions, or problems in the world"
  }
}

IMPORTANT REQUIREMENTS:
- ALL fields must be filled with meaningful content
- The "name" field should be descriptive and based on the story's world/setting
- The "description" field must provide a clear, engaging summary of the world
- The "genre" field must be specific (e.g., "High Fantasy", "Space Opera", "Urban Fantasy", "Cyberpunk", "Historical Fiction", etc.)
- Provide exactly 5 relevant tags that capture the essence of the world
- ALL detail fields must contain substantive information - do not use "Unknown" or "Not specified"
- If information is not explicitly stated, make reasonable inferences based on the story context
- Extract or infer cultural elements, time periods, locations, and conflicts from character interactions and plot elements
- Focus on world-building aspects rather than just plot details

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
        const storyExcerpt = result.substring(0, 300).replace(/[^\w\s.,!?-]/g, ' ').trim()
        return {
          name: `${storyTitle} World`,
          description: `A unique world setting derived from the story "${storyTitle}" with its own distinct characteristics and atmosphere.`,
          genre: "Literary Fiction",
          tags: ["story-based", "narrative", "custom", "literary", "original"],
          details: {
            timePeriod: "Contemporary or unspecified era",
            location: "Setting derived from story context",
            technology: "Modern or period-appropriate technology",
            magic: "None or minimal supernatural elements",
            politics: "Social structures as implied by the narrative",
            culture: "Cultural elements reflected in the story",
            climate: "Environmental conditions as described",
            creatures: "Characters and beings from the story",
            rules: "Social norms and story logic",
            conflicts: storyExcerpt || "Conflicts and tensions from the original narrative"
          }
        }
      }
    } catch (error) {
      console.error('Error generating world from story:', error)
      throw error
    }
  },
  async expandWorldIdea(
    userIdea: string,
    params: WorldExpansionParams
  ): Promise<string> {
    const prompt = `You are a creative world-building assistant. The user has provided a basic world idea or concept. Your job is to expand this into a rich, detailed world setting that includes:

- Setting and location details
- Time period and era
- Technology level and specific technologies
- Magic system (if applicable)
- Political structure and governance
- Culture and society
- Notable creatures or beings
- Major conflicts or tensions
- Unique rules or laws of the world

Take the user's idea and develop it into a comprehensive world description that a storyteller could use. Be creative and add interesting details while staying true to the original concept.

User's world idea: "${userIdea}"

Please provide a detailed world setting expansion (aim for 200-400 words):`

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

      return result || 'Unable to generate world expansion'
    } catch (error) {
      console.error('Error expanding world idea:', error)
      throw error
    }
  },

  async enhanceWorldDetails(
    existingWorld: string,
    focusArea: string,
    params: WorldExpansionParams
  ): Promise<string> {
    const prompt = `You are a world-building assistant. The user has an existing world setting and wants to enhance or expand a specific aspect of it.

Existing world setting:
"${existingWorld}"

Focus area to enhance: "${focusArea}"

Please provide additional details and enhancements for this specific aspect of the world. Be creative and add depth while maintaining consistency with the existing world. Focus on:
- Specific examples and details
- Interesting twists or unique elements
- Connections to other aspects of the world
- Potential story hooks or conflicts

Provide enhanced details (aim for 100-200 words):`

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

      return result || 'Unable to generate world enhancements'
    } catch (error) {
      console.error('Error enhancing world details:', error)
      throw error
    }
  },

  async generateWorldFromPrompt(
    prompt: string,
    params: WorldExpansionParams
  ): Promise<{ name: string; description: string; genre: string; tags: string[]; details: any }> {
    const systemPrompt = `You are a creative world-building assistant. Based on the user's prompt, create a complete world setting. Return your response in this exact JSON format:

{
  "name": "World Name",
  "description": "Brief 1-2 sentence description",
  "genre": "Genre name (e.g., Fantasy, Sci-Fi, Cyberpunk, etc.)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "details": {
    "timePeriod": "Time period or era",
    "location": "Setting location",
    "technology": "Technology level and tools",
    "magic": "Magic system or 'None' if no magic",
    "politics": "Political structure and governance",
    "culture": "Culture and society details",
    "climate": "Climate and environment",
    "creatures": "Notable creatures or beings",
    "rules": "Unique rules or laws of the world",
    "conflicts": "Major conflicts or tensions"
  }
}

Make each field engaging and detailed but concise.

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
        // If JSON parsing fails, create a structured response
        return {
          name: "Generated World",
          description: "AI-generated world setting",
          genre: "Custom",
          tags: ["generated", "ai", "custom"],
          details: {
            timePeriod: "Unknown",
            location: "Various",
            technology: "Mixed",
            magic: "Unknown",
            politics: "Various",
            culture: "Diverse",
            climate: "Varied",
            creatures: "Unknown",
            rules: "To be determined",
            conflicts: result
          }
        }
      }
    } catch (error) {
      console.error('Error generating world from prompt:', error)
      throw error
    }
  }
}