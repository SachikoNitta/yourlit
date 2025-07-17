// Character service for managing character extraction and storage

import { CharacterRepository, Character } from '../repositories/types'
import { characterExtractionService, CharacterExtractionParams } from '../ai'

export interface CharacterExtractionResult {
  characters: Character[]
  extractedCount: number
  errors: string[]
}

export class CharacterService {
  constructor(private characterRepository: CharacterRepository) {}

  // Character CRUD operations
  async createCharacter(characterData: Omit<Character, 'id'>): Promise<Character> {
    return await this.characterRepository.createCharacter(characterData)
  }

  async getCharacter(id: string): Promise<Character | null> {
    return await this.characterRepository.getCharacter(id)
  }

  async getAllCharacters(): Promise<Character[]> {
    const characters = await this.characterRepository.getAllCharacters()
    return characters.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    await this.characterRepository.updateCharacter(id, {
      ...updates,
      lastModified: new Date().toISOString()
    })
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.characterRepository.deleteCharacter(id)
  }

  async getCharactersBySourceStory(storyId: string): Promise<Character[]> {
    return await this.characterRepository.getCharactersBySourceStory(storyId)
  }

  async searchCharacters(query: string): Promise<Character[]> {
    return await this.characterRepository.searchCharacters(query)
  }

  // Character extraction from story content
  async extractCharactersFromStory(
    storyContent: string,
    extractionParams: CharacterExtractionParams,
    storyId?: string,
    nodeId?: string
  ): Promise<CharacterExtractionResult> {
    const errors: string[] = []
    const extractedCharacters: Character[] = []

    try {
      // Use AI to extract characters from story content
      const extractedData = await characterExtractionService.extractCharacters(storyContent, extractionParams)
      
      for (const characterData of extractedData) {
        try {
          // Check if character already exists
          const existingCharacter = await this.findExistingCharacter(characterData.name)
          
          if (existingCharacter) {
            // Update existing character with new information
            await this.mergeCharacterData(existingCharacter, characterData, storyId, nodeId)
            extractedCharacters.push(existingCharacter)
          } else {
            // Create new character
            const newCharacter = await this.createCharacter({
              name: characterData.name,
              description: characterData.description,
              traits: characterData.traits,
              appearance: characterData.appearance,
              backstory: characterData.backstory,
              sourceStoryId: storyId,
              sourceNodeId: nodeId,
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString()
            })
            extractedCharacters.push(newCharacter)
          }
        } catch (error) {
          errors.push(`Failed to process character ${characterData.name}: ${error}`)
        }
      }
    } catch (error) {
      errors.push(`Failed to extract characters from story: ${error}`)
    }

    return {
      characters: extractedCharacters,
      extractedCount: extractedCharacters.length,
      errors
    }
  }


  // Find existing character by name
  private async findExistingCharacter(name: string): Promise<Character | null> {
    const characters = await this.getAllCharacters()
    return characters.find(c => c.name.toLowerCase() === name.toLowerCase()) || null
  }

  // Merge character data with existing character
  private async mergeCharacterData(
    existingCharacter: Character,
    newData: any,
    storyId?: string,
    nodeId?: string
  ): Promise<void> {
    const updates: Partial<Character> = {
      lastModified: new Date().toISOString()
    }

    // Merge description
    if (newData.description && !existingCharacter.description.includes(newData.description)) {
      updates.description = `${existingCharacter.description}. ${newData.description}`
    }

    // Merge traits
    if (newData.traits && newData.traits.length > 0) {
      const existingTraits = new Set(existingCharacter.traits)
      const newTraits = newData.traits.filter((trait: string) => !existingTraits.has(trait))
      if (newTraits.length > 0) {
        updates.traits = [...existingCharacter.traits, ...newTraits]
      }
    }

    // Update appearance if not present
    if (newData.appearance && !existingCharacter.appearance) {
      updates.appearance = newData.appearance
    }

    // Update backstory if not present
    if (newData.backstory && !existingCharacter.backstory) {
      updates.backstory = newData.backstory
    }

    // Update source story if provided
    if (storyId && existingCharacter.sourceStoryId !== storyId) {
      updates.sourceStoryId = storyId
    }

    if (nodeId && existingCharacter.sourceNodeId !== nodeId) {
      updates.sourceNodeId = nodeId
    }

    if (Object.keys(updates).length > 1) { // More than just lastModified
      await this.updateCharacter(existingCharacter.id, updates)
    }
  }

  // Utility methods
  async getCharacterStats(): Promise<{
    totalCharacters: number
    charactersWithBackstory: number
    charactersWithAppearance: number
    averageTraitsPerCharacter: number
  }> {
    const characters = await this.getAllCharacters()
    
    return {
      totalCharacters: characters.length,
      charactersWithBackstory: characters.filter(c => c.backstory).length,
      charactersWithAppearance: characters.filter(c => c.appearance).length,
      averageTraitsPerCharacter: characters.reduce((sum, c) => sum + c.traits.length, 0) / characters.length || 0
    }
  }

  async exportCharacter(character: Character): Promise<string> {
    return `# ${character.name}

**Description:** ${character.description}

**Traits:** ${character.traits.join(', ')}

${character.appearance ? `**Appearance:** ${character.appearance}` : ''}

${character.backstory ? `**Backstory:** ${character.backstory}` : ''}

---
Created: ${new Date(character.createdAt).toLocaleString()}
Last Modified: ${new Date(character.lastModified).toLocaleString()}
${character.sourceStoryId ? `Source Story: ${character.sourceStoryId}` : ''}
`
  }

  async duplicateCharacter(characterId: string, newName?: string): Promise<Character> {
    const original = await this.getCharacter(characterId)
    if (!original) {
      throw new Error(`Character with id ${characterId} not found`)
    }

    return await this.createCharacter({
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      traits: [...original.traits],
      appearance: original.appearance,
      backstory: original.backstory,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    })
  }
}