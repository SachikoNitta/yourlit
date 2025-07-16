"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Edit, Trash2, Download, Copy, User, BookOpen } from 'lucide-react'
import { Character } from '@/lib/repositories/types'
import { CharacterService } from '@/lib/services/characterService'
import { getServiceManager } from '@/lib/services'
import { loadSettings } from '@/lib/settings'

interface CharactersPageProps {
  onClose?: () => void
}

export const CharactersPage: React.FC<CharactersPageProps> = ({ onClose }) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [characterService, setCharacterService] = useState<CharacterService | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    traits: '',
    appearance: '',
    backstory: ''
  })

  useEffect(() => {
    const initializeService = async () => {
      const settings = await loadSettings()
      const serviceManager = getServiceManager(settings)
      setCharacterService(serviceManager.characters)
    }
    initializeService()
  }, [])

  useEffect(() => {
    if (characterService) {
      loadCharacters()
    }
  }, [characterService])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = characters.filter(character =>
        character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        character.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        character.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCharacters(filtered)
    } else {
      setFilteredCharacters(characters)
    }
  }, [searchQuery, characters])

  const loadCharacters = async () => {
    if (!characterService) return
    setIsLoading(true)
    try {
      const chars = await characterService.getAllCharacters()
      setCharacters(chars)
      setFilteredCharacters(chars)
    } catch (error) {
      console.error('Error loading characters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCharacter = async () => {
    if (!characterService) return
    
    try {
      await characterService.createCharacter({
        name: formData.name,
        description: formData.description,
        traits: formData.traits.split(',').map(t => t.trim()).filter(t => t),
        appearance: formData.appearance,
        backstory: formData.backstory,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      })
      
      setIsCreateDialogOpen(false)
      resetForm()
      loadCharacters()
    } catch (error) {
      console.error('Error creating character:', error)
    }
  }

  const handleUpdateCharacter = async () => {
    if (!characterService || !selectedCharacter) return
    
    try {
      await characterService.updateCharacter(selectedCharacter.id, {
        name: formData.name,
        description: formData.description,
        traits: formData.traits.split(',').map(t => t.trim()).filter(t => t),
        appearance: formData.appearance,
        backstory: formData.backstory,
        lastModified: new Date().toISOString()
      })
      
      setIsEditDialogOpen(false)
      setSelectedCharacter(null)
      resetForm()
      loadCharacters()
    } catch (error) {
      console.error('Error updating character:', error)
    }
  }

  const handleDeleteCharacter = async (characterId: string) => {
    if (!characterService) return
    
    if (confirm('Are you sure you want to delete this character?')) {
      try {
        await characterService.deleteCharacter(characterId)
        loadCharacters()
      } catch (error) {
        console.error('Error deleting character:', error)
      }
    }
  }

  const handleDuplicateCharacter = async (character: Character) => {
    if (!characterService) return
    
    try {
      await characterService.duplicateCharacter(character.id, `${character.name} (Copy)`)
      loadCharacters()
    } catch (error) {
      console.error('Error duplicating character:', error)
    }
  }

  const handleExportCharacter = async (character: Character) => {
    if (!characterService) return
    
    try {
      const exportData = await characterService.exportCharacter(character)
      const blob = new Blob([exportData], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting character:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      traits: '',
      appearance: '',
      backstory: ''
    })
  }

  const openEditDialog = (character: Character) => {
    setSelectedCharacter(character)
    setFormData({
      name: character.name,
      description: character.description,
      traits: character.traits.join(', '),
      appearance: character.appearance || '',
      backstory: character.backstory || ''
    })
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Characters</h2>
          <p className="text-gray-600">Manage your story characters</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Character
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search characters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Characters Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading characters...</p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery ? 'No characters found' : 'No characters yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Create your first character or extract them from stories'
            }
          </p>
          {!searchQuery && (
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Character
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map((character) => (
            <Card key={character.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{character.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(character)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateCharacter(character)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportCharacter(character)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCharacter(character.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {character.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {character.traits.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {character.traits.slice(0, 3).map((trait, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                      {character.traits.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{character.traits.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {character.appearance && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-medium">Appearance:</span> {character.appearance}
                    </p>
                  </div>
                )}

                {character.sourceStoryId && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <BookOpen className="w-3 h-3" />
                    <span>From story</span>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  Modified: {new Date(character.lastModified).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Character Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Character name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the character"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="traits">Traits</Label>
              <Input
                id="traits"
                value={formData.traits}
                onChange={(e) => setFormData({ ...formData, traits: e.target.value })}
                placeholder="brave, kind, intelligent (comma-separated)"
              />
            </div>
            
            <div>
              <Label htmlFor="appearance">Appearance</Label>
              <Textarea
                id="appearance"
                value={formData.appearance}
                onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                placeholder="Physical description"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="backstory">Backstory</Label>
              <Textarea
                id="backstory"
                value={formData.backstory}
                onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                placeholder="Character's background and history"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCharacter}
                disabled={!formData.name || !formData.description}
              >
                Create Character
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Character Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Character name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the character"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-traits">Traits</Label>
              <Input
                id="edit-traits"
                value={formData.traits}
                onChange={(e) => setFormData({ ...formData, traits: e.target.value })}
                placeholder="brave, kind, intelligent (comma-separated)"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-appearance">Appearance</Label>
              <Textarea
                id="edit-appearance"
                value={formData.appearance}
                onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                placeholder="Physical description"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-backstory">Backstory</Label>
              <Textarea
                id="edit-backstory"
                value={formData.backstory}
                onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                placeholder="Character's background and history"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCharacter}
                disabled={!formData.name || !formData.description}
              >
                Update Character
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}