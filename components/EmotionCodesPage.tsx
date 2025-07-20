"use client"

import { useState, useEffect } from "react"
import { EmotionCode, emotionCodesStorage, emotionCodeTemplates, emotionTones, EmotionStep } from "../lib/emotionCodes"
import { emotionExpansionService, EmotionExpansionParams } from "../lib/ai/emotionExpansion"
import { Draft, draftsStorage } from "../lib/draftsStorage"
import { Plus, Edit, Trash2, Copy, Star, StarOff, Save, X, Heart, Zap, Wand2, Loader2, Sparkles, FileText, Play, Pause } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { dateUtils } from "../lib/dateUtils"
import { AppSettings } from "../lib/settings"

interface EmotionCodesPageProps {
  isHydrated: boolean
  settings?: AppSettings
}

export function EmotionCodesPage({ isHydrated, settings }: EmotionCodesPageProps) {
  const [emotionCodes, setEmotionCodes] = useState<EmotionCode[]>([])
  const [selectedCode, setSelectedCode] = useState<EmotionCode | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showStorySelector, setShowStorySelector] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editForm, setEditForm] = useState<Partial<EmotionCode>>({})
  const [availableStories, setAvailableStories] = useState<Draft[]>([])
  const [selectedStory, setSelectedStory] = useState<Draft | null>(null)
  const [previewStep, setPreviewStep] = useState<number>(-1)

  useEffect(() => {
    if (isHydrated) {
      loadEmotionCodes()
      loadAvailableStories()
    }
  }, [isHydrated])

  const loadEmotionCodes = () => {
    const codes = emotionCodesStorage.loadEmotionCodes()
    setEmotionCodes(codes)
  }

  const loadAvailableStories = () => {
    const stories = draftsStorage.loadDrafts()
    setAvailableStories(stories)
  }

  const getAiParams = (): EmotionExpansionParams | null => {
    if (!settings) return null
    
    return {
      openaiKey: settings.openaiKey,
      geminiKey: settings.geminiKey,
      aiProvider: settings.aiProvider,
      responseLanguage: settings.responseLanguage
    }
  }

  const handleCreateFromTemplate = (template: Omit<EmotionCode, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => {
    const newCode = emotionCodesStorage.addEmotionCode({
      ...template,
      isActive: false
    })
    setEmotionCodes([newCode, ...emotionCodes])
    setSelectedCode(newCode)
    setShowTemplates(false)
  }

  const handleCreateNew = () => {
    setEditForm({
      name: '',
      steps: [{ tone: 'calm', label: '穏やか', duration: 1 }],
      tags: [],
      isActive: false
    })
    setIsCreating(true)
    setIsEditing(true)
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

      const generatedCode = await emotionExpansionService.generateEmotionCodeFromStory(
        story.title,
        story.content,
        aiParams
      )
      
      setEditForm({
        name: generatedCode.name,
        steps: generatedCode.steps,
        tags: generatedCode.tags,
        isActive: false
      })
      setIsCreating(true)
      setIsEditing(true)
      setShowStorySelector(false)
      setSelectedStory(null)
    } catch (error) {
      console.error('Error generating emotion code from story:', error)
      let errorMessage = 'Failed to generate emotion code from story. Please check your AI settings.'
      
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

  const handleEdit = (code: EmotionCode) => {
    setEditForm(code)
    setSelectedCode(code)
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleSave = () => {
    if (isCreating) {
      const newCode = emotionCodesStorage.addEmotionCode({
        name: editForm.name || 'Untitled Code',
        steps: editForm.steps || [],
        tags: editForm.tags || [],
        isActive: false
      })
      setEmotionCodes([newCode, ...emotionCodes])
      setSelectedCode(newCode)
    } else if (selectedCode) {
      const updatedCodes = emotionCodesStorage.updateEmotionCode(selectedCode.id, editForm)
      setEmotionCodes(updatedCodes)
      setSelectedCode({ ...selectedCode, ...editForm, updatedAt: new Date().toISOString() })
    }
    setIsEditing(false)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setEditForm({})
    setIsEditing(false)
    setIsCreating(false)
    if (isCreating) {
      setSelectedCode(null)
    }
  }

  const handleDelete = (id: string) => {
    const updatedCodes = emotionCodesStorage.deleteEmotionCode(id)
    setEmotionCodes(updatedCodes)
    if (selectedCode?.id === id) {
      setSelectedCode(null)
    }
  }

  const handleSetActive = (id: string) => {
    const updatedCodes = emotionCodesStorage.setActiveEmotionCode(id)
    setEmotionCodes(updatedCodes)
    const activeCode = updatedCodes.find(c => c.id === id)
    if (activeCode) {
      setSelectedCode(activeCode)
    }
  }

  const handleDuplicate = (id: string) => {
    const duplicated = emotionCodesStorage.duplicateEmotionCode(id)
    if (duplicated) {
      setEmotionCodes([duplicated, ...emotionCodes])
    }
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setEditForm({ ...editForm, tags })
  }

  const handleStepChange = (index: number, field: keyof EmotionStep, value: string | number) => {
    const steps = [...(editForm.steps || [])]
    steps[index] = { ...steps[index], [field]: value }
    setEditForm({ ...editForm, steps })
  }

  const addStep = () => {
    const steps = [...(editForm.steps || [])]
    steps.push({ tone: 'calm', label: '新しい感情', duration: 1 })
    setEditForm({ ...editForm, steps })
  }

  const removeStep = (index: number) => {
    const steps = [...(editForm.steps || [])]
    steps.splice(index, 1)
    setEditForm({ ...editForm, steps })
  }

  const getTotalDuration = (steps: EmotionStep[]) => {
    return steps.reduce((total, step) => total + step.duration, 0)
  }

  const getStepPercentage = (step: EmotionStep, totalDuration: number) => {
    return (step.duration / totalDuration) * 100
  }

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      calm: 'bg-blue-200',
      thrill: 'bg-red-200',
      tension: 'bg-orange-200',
      emotional: 'bg-pink-200',
      dark: 'bg-gray-400',
      hope: 'bg-yellow-200',
      triumph: 'bg-green-200',
      curiosity: 'bg-purple-200',
      sweet: 'bg-rose-200',
      light: 'bg-cyan-200',
      funny: 'bg-lime-200',
      chaos: 'bg-red-300',
      revelation: 'bg-indigo-200',
      melancholy: 'bg-slate-300',
      excitement: 'bg-amber-200',
      peaceful: 'bg-emerald-200',
      nostalgic: 'bg-violet-200',
      mysterious: 'bg-purple-300'
    }
    return colors[tone] || 'bg-gray-200'
  }

  const activeCode = emotionCodes.find(c => c.isActive)
  const hasAiSettings = settings && (settings.openaiKey || settings.geminiKey)

  return (
    <div className="ml-12 w-[calc(100vw-3rem)] p-6">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emotion Codes</h1>
            <p className="text-gray-600 mt-1">Create and manage emotional progressions for your stories</p>
            {activeCode && (
              <div className="mt-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Active: {activeCode.name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Heart size={16} />
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

        <div className="flex gap-6">
          {/* Emotion Codes List */}
          <div className="w-1/3 space-y-4">
            <h2 className="text-xl font-semibold">Your Emotion Codes</h2>
            {emotionCodes.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                <p>No emotion codes yet.</p>
                <p className="text-sm mt-2">Create your first emotion code to get started!</p>
              </Card>
            ) : (
              emotionCodes.map((code) => (
                <Card
                  key={code.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCode?.id === code.id ? 'ring-2 ring-blue-500' : ''
                  } ${code.isActive ? 'border-yellow-400 bg-yellow-50' : ''}`}
                  onClick={() => setSelectedCode(code)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {code.name}
                          {code.isActive && <Star className="w-4 h-4 text-yellow-500" />}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{code.steps.length} steps</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(code)
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicate(code.id)
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(code.id)
                          }}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Emotion Bar Preview */}
                    <div className="flex h-4 rounded-full overflow-hidden mb-2">
                      {code.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`${getToneColor(step.tone)} transition-all duration-300`}
                          style={{ width: `${getStepPercentage(step, getTotalDuration(code.steps))}%` }}
                          title={`${step.label} (${step.duration})`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {code.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {code.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{code.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {dateUtils.formatDate(code.updatedAt)}
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
                  <CardTitle>{isCreating ? 'Create New Emotion Code' : 'Edit Emotion Code'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g., Hero's Journey"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                    <Input
                      value={editForm.tags?.join(', ') || ''}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="e.g., adventure, emotional, classic"
                    />
                  </div>

                  {/* Steps Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Emotion Steps</label>
                      <Button onClick={addStep} size="sm" variant="outline">
                        <Plus size={14} className="mr-1" />
                        Add Step
                      </Button>
                    </div>
                    
                    {/* Emotion Bar Preview */}
                    {editForm.steps && editForm.steps.length > 0 && (
                      <div className="flex h-6 rounded-full overflow-hidden mb-4 border">
                        {editForm.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className={`${getToneColor(step.tone)} flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-300 ${previewStep === idx ? 'ring-2 ring-blue-500' : ''}`}
                            style={{ width: `${getStepPercentage(step, getTotalDuration(editForm.steps!))}%` }}
                            onMouseEnter={() => setPreviewStep(idx)}
                            onMouseLeave={() => setPreviewStep(-1)}
                            title={`${step.label} (${step.duration})`}
                          >
                            {step.duration}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {editForm.steps?.map((step, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                          <div className="flex-1">
                            <Select
                              value={step.tone}
                              onValueChange={(value) => handleStepChange(index, 'tone', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {emotionTones.map((tone) => (
                                  <SelectItem key={tone.value} value={tone.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${getToneColor(tone.value)}`} />
                                      {tone.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Input
                              value={step.label}
                              onChange={(e) => handleStepChange(index, 'label', e.target.value)}
                              placeholder="感情ラベル"
                            />
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={step.duration}
                              onChange={(e) => handleStepChange(index, 'duration', parseInt(e.target.value) || 1)}
                              placeholder="長さ"
                            />
                          </div>
                          <Button
                            onClick={() => removeStep(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
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
            ) : selectedCode ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedCode.name}
                        {selectedCode.isActive && <Star className="w-5 h-5 text-yellow-500" />}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{selectedCode.steps.length} emotion steps</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSetActive(selectedCode.id)}
                        variant={selectedCode.isActive ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {selectedCode.isActive ? <StarOff size={14} /> : <Star size={14} />}
                        {selectedCode.isActive ? 'Deactivate' : 'Set Active'}
                      </Button>
                      <Button
                        onClick={() => handleEdit(selectedCode)}
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
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCode.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Emotion Progression Visualization */}
                  <div>
                    <h4 className="font-semibold mb-2">Emotion Progression</h4>
                    <div className="flex h-8 rounded-full overflow-hidden border mb-4">
                      {selectedCode.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`${getToneColor(step.tone)} flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-300 ${previewStep === idx ? 'ring-2 ring-blue-500' : ''}`}
                          style={{ width: `${getStepPercentage(step, getTotalDuration(selectedCode.steps))}%` }}
                          onMouseEnter={() => setPreviewStep(idx)}
                          onMouseLeave={() => setPreviewStep(-1)}
                          title={`${step.label} (${step.duration})`}
                        >
                          {step.duration}
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      {selectedCode.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className={`w-4 h-4 rounded-full ${getToneColor(step.tone)}`} />
                          <span className="font-medium">{step.label}</span>
                          <span className="text-sm text-gray-500">({step.duration})</span>
                          <div className="ml-auto text-xs text-gray-400">
                            {Math.round(getStepPercentage(step, getTotalDuration(selectedCode.steps)))}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Created: {dateUtils.formatDate(selectedCode.createdAt)} | 
                    Updated: {dateUtils.formatDate(selectedCode.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-4" />
                  <p>Select an emotion code to view details</p>
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
                <h3 className="text-lg font-semibold">Generate Emotion Code from Story</h3>
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
                    <p className="text-sm mt-2">Create some stories first to generate emotion codes from them.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Select a story to extract emotion progression information. AI will analyze the story and create emotional flow patterns.
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
                                  Extract Emotion Code
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
                <h3 className="text-lg font-semibold">Emotion Code Templates</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emotionCodeTemplates.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600">{template.steps.length} steps</p>
                      </CardHeader>
                      <CardContent>
                        {/* Template Preview */}
                        <div className="flex h-4 rounded-full overflow-hidden mb-3">
                          {template.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className={`${getToneColor(step.tone)}`}
                              style={{ width: `${getStepPercentage(step, getTotalDuration(template.steps))}%` }}
                              title={`${step.label} (${step.duration})`}
                            />
                          ))}
                        </div>
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