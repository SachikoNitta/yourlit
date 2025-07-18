"use client"

import { useState, useEffect } from "react"
import { WorldSetting, worldSettingsStorage, worldSettingTemplates } from "../lib/worldSettings"
import { worldExpansionService, WorldExpansionParams } from "../lib/ai/worldExpansion"
import { Draft, draftsStorage } from "../lib/draftsStorage"
import { Plus, Edit, Trash2, Copy, Star, StarOff, Save, X, BookOpen, Zap, Wand2, Loader2, Sparkles, FileText } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { dateUtils } from "../lib/dateUtils"
import { AppSettings } from "../lib/settings"

interface WorldSettingsPageProps {
  isHydrated: boolean
  settings?: AppSettings
}

export function WorldSettingsPage({ isHydrated, settings }: WorldSettingsPageProps) {
  const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([])
  const [selectedSetting, setSelectedSetting] = useState<WorldSetting | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showStorySelector, setShowStorySelector] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editForm, setEditForm] = useState<Partial<WorldSetting>>({})
  const [quickPrompt, setQuickPrompt] = useState('')
  const [availableStories, setAvailableStories] = useState<Draft[]>([])
  const [selectedStory, setSelectedStory] = useState<Draft | null>(null)

  useEffect(() => {
    if (isHydrated) {
      loadWorldSettings()
      loadAvailableStories()
    }
  }, [isHydrated])

  const loadWorldSettings = () => {
    const settings = worldSettingsStorage.loadWorldSettings()
    setWorldSettings(settings)
  }

  const loadAvailableStories = () => {
    const stories = draftsStorage.loadDrafts()
    setAvailableStories(stories)
  }

  const getAiParams = (): WorldExpansionParams | null => {
    if (!settings) return null
    
    return {
      openaiKey: settings.openaiKey,
      geminiKey: settings.geminiKey,
      aiProvider: settings.aiProvider,
      responseLanguage: settings.responseLanguage
    }
  }

  const handleCreateFromTemplate = (template: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => {
    const newSetting = worldSettingsStorage.addWorldSetting({
      ...template,
      isActive: false
    })
    setWorldSettings([newSetting, ...worldSettings])
    setSelectedSetting(newSetting)
    setShowTemplates(false)
  }

  const handleCreateNew = () => {
    setEditForm({
      name: '',
      description: '',
      genre: '',
      tags: [],
      details: {},
      isActive: false
    })
    setIsCreating(true)
    setIsEditing(true)
  }

  const handleCreateFromPrompt = async () => {
    if (!quickPrompt.trim() || !settings) return
    
    setIsGenerating(true)
    try {
      const aiParams = getAiParams()
      if (!aiParams) {
        throw new Error('AI settings not available')
      }

      const generatedWorld = await worldExpansionService.generateWorldFromPrompt(quickPrompt, aiParams)
      
      setEditForm({
        name: generatedWorld.name,
        description: generatedWorld.description,
        genre: generatedWorld.genre,
        tags: generatedWorld.tags,
        details: generatedWorld.details,
        isActive: false
      })
      setIsCreating(true)
      setIsEditing(true)
      setQuickPrompt('')
    } catch (error) {
      console.error('Error generating world:', error)
      let errorMessage = 'Failed to generate world. Please check your AI settings.'
      
      if (error instanceof Error) {
        if (error.message.includes('No API key')) {
          errorMessage = 'Please configure your AI API key in Settings.'
        } else if (error.message.includes('API error')) {
          errorMessage = 'AI service error. Please try again or check your API key.'
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateFromStory = async (story: Draft) => {
    if (!settings) return
    
    setIsGenerating(true)
    setSelectedStory(story)
    
    try {
      const aiParams = getAiParams()
      if (!aiParams) {
        throw new Error('AI settings not available')
      }

      const generatedWorld = await worldExpansionService.generateWorldFromStory(
        story.title,
        story.content,
        aiParams
      )
      
      setEditForm({
        name: generatedWorld.name,
        description: generatedWorld.description,
        genre: generatedWorld.genre,
        tags: generatedWorld.tags,
        details: generatedWorld.details,
        isActive: false
      })
      setIsCreating(true)
      setIsEditing(true)
      setShowStorySelector(false)
      setSelectedStory(null)
    } catch (error) {
      console.error('Error generating world from story:', error)
      let errorMessage = 'Failed to generate world from story. Please check your AI settings.'
      
      if (error instanceof Error) {
        if (error.message.includes('No API key')) {
          errorMessage = 'Please configure your AI API key in Settings.'
        } else if (error.message.includes('API error')) {
          errorMessage = 'AI service error. Please try again or check your API key.'
        }
      }
      
      alert(errorMessage)
      setSelectedStory(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEdit = (setting: WorldSetting) => {
    setEditForm(setting)
    setSelectedSetting(setting)
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleSave = () => {
    if (isCreating) {
      const newSetting = worldSettingsStorage.addWorldSetting({
        name: editForm.name || 'Untitled World',
        description: editForm.description || '',
        genre: editForm.genre || '',
        tags: editForm.tags || [],
        details: editForm.details || {},
        isActive: false
      })
      setWorldSettings([newSetting, ...worldSettings])
      setSelectedSetting(newSetting)
    } else if (selectedSetting) {
      const updatedSettings = worldSettingsStorage.updateWorldSetting(selectedSetting.id, editForm)
      setWorldSettings(updatedSettings)
      setSelectedSetting({ ...selectedSetting, ...editForm, updatedAt: new Date().toISOString() })
    }
    setIsEditing(false)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setEditForm({})
    setIsEditing(false)
    setIsCreating(false)
    if (isCreating) {
      setSelectedSetting(null)
    }
  }

  const handleDelete = (id: string) => {
    const updatedSettings = worldSettingsStorage.deleteWorldSetting(id)
    setWorldSettings(updatedSettings)
    if (selectedSetting?.id === id) {
      setSelectedSetting(null)
    }
  }

  const handleSetActive = (id: string) => {
    const updatedSettings = worldSettingsStorage.setActiveWorldSetting(id)
    setWorldSettings(updatedSettings)
    const activeSetting = updatedSettings.find(s => s.id === id)
    if (activeSetting) {
      setSelectedSetting(activeSetting)
    }
  }

  const handleDuplicate = (id: string) => {
    const duplicated = worldSettingsStorage.duplicateWorldSetting(id)
    if (duplicated) {
      setWorldSettings([duplicated, ...worldSettings])
    }
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setEditForm({ ...editForm, tags })
  }

  const activeSetting = worldSettings.find(s => s.isActive)
  const hasAiSettings = settings && (settings.openaiKey || settings.geminiKey)

  return (
    <div className="ml-12 w-[calc(100vw-3rem)] p-6">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">World Settings</h1>
            <p className="text-gray-600 mt-1">Create and manage world settings for your stories</p>
            {activeSetting && (
              <div className="mt-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Active: {activeSetting.name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BookOpen size={16} />
              Templates
            </Button>
            {hasAiSettings && availableStories.length > 0 && (
              <Button
                onClick={() => setShowStorySelector(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText size={16} />
                From Story
              </Button>
            )}
            <Button
              onClick={handleCreateNew}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create New
            </Button>
          </div>
        </div>

        {/* Quick AI Generation */}
        {hasAiSettings && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Quick AI World Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="Describe a world idea... (e.g., 'underwater city with bio-luminescent technology')"
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateFromPrompt}
                  disabled={!quickPrompt.trim() || isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate World
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-6">
          {/* World Settings List */}
          <div className="w-1/3 space-y-4">
            <h2 className="text-xl font-semibold">Your Worlds</h2>
            {worldSettings.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                <p>No world settings yet.</p>
                <p className="text-sm mt-2">Create your first world setting to get started!</p>
              </Card>
            ) : (
              worldSettings.map((setting) => (
                <Card
                  key={setting.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSetting?.id === setting.id ? 'ring-2 ring-blue-500' : ''
                  } ${setting.isActive ? 'border-yellow-400 bg-yellow-50' : ''}`}
                  onClick={() => setSelectedSetting(setting)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {setting.name}
                          {setting.isActive && <Star className="w-4 h-4 text-yellow-500" />}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{setting.genre}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(setting)
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicate(setting.id)
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(setting.id)
                          }}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{setting.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {setting.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {setting.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{setting.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {dateUtils.formatDate(setting.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Details/Edit Panel */}
          <div className="flex-1">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>{isCreating ? 'Create New World' : 'Edit World Setting'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g., Space Fantasy Universe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Genre</label>
                    <Input
                      value={editForm.genre || ''}
                      onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                      placeholder="e.g., Science Fantasy"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Describe your world setting..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                    <Input
                      value={editForm.tags?.join(', ') || ''}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="e.g., space, magic, technology, aliens"
                    />
                  </div>

                  {/* World Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Period</label>
                      <Input
                        value={editForm.details?.timePeriod || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          details: { ...editForm.details, timePeriod: e.target.value }
                        })}
                        placeholder="e.g., Far future"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <Input
                        value={editForm.details?.location || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          details: { ...editForm.details, location: e.target.value }
                        })}
                        placeholder="e.g., Multiple star systems"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Technology</label>
                      <Input
                        value={editForm.details?.technology || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          details: { ...editForm.details, technology: e.target.value }
                        })}
                        placeholder="e.g., Advanced AI, spaceships"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Magic</label>
                      <Input
                        value={editForm.details?.magic || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          details: { ...editForm.details, magic: e.target.value }
                        })}
                        placeholder="e.g., Crystal-based magic"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Climate</label>
                      <Input
                        value={editForm.details?.climate || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          details: { ...editForm.details, climate: e.target.value }
                        })}
                        placeholder="e.g., Varied by planet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Creatures</label>
                      <Input
                        value={editForm.details?.creatures || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          details: { ...editForm.details, creatures: e.target.value }
                        })}
                        placeholder="e.g., Space dragons, aliens"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Culture & Politics</label>
                    <Textarea
                      value={editForm.details?.politics || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        details: { ...editForm.details, politics: e.target.value }
                      })}
                      placeholder="Describe the political systems and cultures..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rules & Laws</label>
                    <Textarea
                      value={editForm.details?.rules || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        details: { ...editForm.details, rules: e.target.value }
                      })}
                      placeholder="Unique rules and laws of this world..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Conflicts & Tensions</label>
                    <Textarea
                      value={editForm.details?.conflicts || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        details: { ...editForm.details, conflicts: e.target.value }
                      })}
                      placeholder="Main conflicts and tensions..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex items-center gap-2">
                      <Save size={16} />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X size={16} />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedSetting ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedSetting.name}
                        {selectedSetting.isActive && <Star className="w-5 h-5 text-yellow-500" />}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{selectedSetting.genre}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSetActive(selectedSetting.id)}
                        variant={selectedSetting.isActive ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {selectedSetting.isActive ? <StarOff size={14} /> : <Star size={14} />}
                        {selectedSetting.isActive ? 'Deactivate' : 'Set Active'}
                      </Button>
                      <Button
                        onClick={() => handleEdit(selectedSetting)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-700">{selectedSetting.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSetting.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* World Details Display */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSetting.details.timePeriod && (
                      <div>
                        <h4 className="font-semibold text-sm">Time Period</h4>
                        <p className="text-sm text-gray-600">{selectedSetting.details.timePeriod}</p>
                      </div>
                    )}
                    {selectedSetting.details.location && (
                      <div>
                        <h4 className="font-semibold text-sm">Location</h4>
                        <p className="text-sm text-gray-600">{selectedSetting.details.location}</p>
                      </div>
                    )}
                    {selectedSetting.details.technology && (
                      <div>
                        <h4 className="font-semibold text-sm">Technology</h4>
                        <p className="text-sm text-gray-600">{selectedSetting.details.technology}</p>
                      </div>
                    )}
                    {selectedSetting.details.magic && (
                      <div>
                        <h4 className="font-semibold text-sm">Magic</h4>
                        <p className="text-sm text-gray-600">{selectedSetting.details.magic}</p>
                      </div>
                    )}
                    {selectedSetting.details.climate && (
                      <div>
                        <h4 className="font-semibold text-sm">Climate</h4>
                        <p className="text-sm text-gray-600">{selectedSetting.details.climate}</p>
                      </div>
                    )}
                    {selectedSetting.details.creatures && (
                      <div>
                        <h4 className="font-semibold text-sm">Creatures</h4>
                        <p className="text-sm text-gray-600">{selectedSetting.details.creatures}</p>
                      </div>
                    )}
                  </div>

                  {selectedSetting.details.politics && (
                    <div>
                      <h4 className="font-semibold text-sm">Culture & Politics</h4>
                      <p className="text-sm text-gray-600">{selectedSetting.details.politics}</p>
                    </div>
                  )}

                  {selectedSetting.details.rules && (
                    <div>
                      <h4 className="font-semibold text-sm">Rules & Laws</h4>
                      <p className="text-sm text-gray-600">{selectedSetting.details.rules}</p>
                    </div>
                  )}

                  {selectedSetting.details.conflicts && (
                    <div>
                      <h4 className="font-semibold text-sm">Conflicts & Tensions</h4>
                      <p className="text-sm text-gray-600">{selectedSetting.details.conflicts}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Created: {dateUtils.formatDate(selectedSetting.createdAt)} | 
                    Updated: {dateUtils.formatDate(selectedSetting.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4" />
                  <p>Select a world setting to view details</p>
                  <p className="text-sm mt-2">or create a new one to get started</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Story Selector Modal */}
        {showStorySelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Generate World from Story</h3>
                <button
                  onClick={() => setShowStorySelector(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {availableStories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p>No stories available.</p>
                    <p className="text-sm mt-2">Create some stories first to generate worlds from them.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Select a story to extract world setting information from. AI will analyze the story and create structured world settings.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableStories.map((story) => (
                        <Card 
                          key={story.id} 
                          className={`cursor-pointer hover:shadow-md transition-shadow ${
                            selectedStory?.id === story.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedStory(story)}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg">{story.title}</CardTitle>
                            <p className="text-xs text-gray-500">
                              Created: {dateUtils.formatDate(story.createdAt)}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                              {story.content.substring(0, 150)}...
                            </p>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateFromStory(story)
                              }}
                              disabled={isGenerating}
                              size="sm"
                              className="w-full flex items-center gap-2"
                            >
                              {isGenerating && selectedStory?.id === story.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Analyzing Story...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3 h-3" />
                                  Extract World Settings
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">World Setting Templates</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worldSettingTemplates.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600">{template.genre}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-3">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleCreateFromTemplate(template)}
                          size="sm"
                          className="w-full"
                        >
                          Use This Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}