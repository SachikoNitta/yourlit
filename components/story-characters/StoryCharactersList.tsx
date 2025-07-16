"use client"

import { useState, useEffect } from "react"
import { Character } from "@/lib/repositories/types"
import { getServiceManager } from "@/lib/services"
import { loadSettings } from "@/lib/settings"
import { User, Edit, Trash2, Download } from "lucide-react"

interface StoryCharactersListProps {
  storyId: string
  title?: string
}

export function StoryCharactersList({ storyId, title = "Characters in this Story" }: StoryCharactersListProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [storyId])

  const loadCharacters = async () => {
    setIsLoading(true)
    try {
      const settings = loadSettings()
      const serviceManager = getServiceManager(settings)
      const characterService = serviceManager.characters
      
      const storyCharacters = await characterService.getCharactersBySourceStory(storyId)
      setCharacters(storyCharacters)
    } catch (error) {
      console.error('Error loading characters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const settings = loadSettings()
      const serviceManager = getServiceManager(settings)
      const characterService = serviceManager.characters
      
      await characterService.deleteCharacter(characterId)
      setCharacters(characters.filter(c => c.id !== characterId))
    } catch (error) {
      console.error('Error deleting character:', error)
    }
  }

  const handleExportCharacter = async (character: Character) => {
    try {
      const settings = loadSettings()
      const serviceManager = getServiceManager(settings)
      const characterService = serviceManager.characters
      
      const exportContent = await characterService.exportCharacter(character)
      
      const blob = new Blob([exportContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${character.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting character:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500">Loading characters...</div>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500 italic">No characters found for this story. Try extracting characters to see them here.</div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title} ({characters.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character, index) => (
          <div
            key={`${character.id}-${index}-${character.name}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900 truncate">{character.name}</h4>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleExportCharacter(character)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Export character"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCharacter(character.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete character"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {character.description}
            </p>
            
            {character.traits && character.traits.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {character.traits.slice(0, 3).map((trait, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                    >
                      {trait}
                    </span>
                  ))}
                  {character.traits.length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                      +{character.traits.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {character.appearance && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">Appearance:</span>
                <p className="text-xs text-gray-600 line-clamp-2">{character.appearance}</p>
              </div>
            )}
            
            {character.backstory && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">Backstory:</span>
                <p className="text-xs text-gray-600 line-clamp-2">{character.backstory}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}