import { useState, useEffect } from "react"
import { ArrowLeft, Wand2, Loader2, Plus, Trash2, Copy, Save, Eye, EyeOff } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Draft, StoryVersion } from "../../lib/draftsStorage"
import { storyGenerationService, GenerationParams } from "../../lib/ai"
import { dateUtils } from "../../lib/dateUtils"

interface VersionEditorProps {
  draft: Draft
  onGoBack: () => void
  onSaveVersion: (version: StoryVersion) => void
  onCopyToClipboard: (content: string) => void
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
}

interface VersionDraft {
  id: string
  title: string
  instructions: string
  content: string
  isGenerating: boolean
  isGenerated: boolean
  createdAt: string
}

export function VersionEditor({
  draft,
  onGoBack,
  onSaveVersion,
  onCopyToClipboard,
  openaiKey,
  geminiKey,
  aiProvider,
  responseLanguage
}: VersionEditorProps) {
  const [versionDrafts, setVersionDrafts] = useState<VersionDraft[]>([])
  const [previewVersion, setPreviewVersion] = useState<string | null>(null)
  
  useEffect(() => {
    // Initialize with one empty version draft
    addNewVersionDraft()
  }, [])

  const addNewVersionDraft = () => {
    const newVersion: VersionDraft = {
      id: `version-${Date.now()}`,
      title: `${draft.title} - Version ${versionDrafts.length + 1}`,
      instructions: '',
      content: '',
      isGenerating: false,
      isGenerated: false,
      createdAt: new Date().toISOString()
    }
    setVersionDrafts(prev => [...prev, newVersion])
  }

  const updateVersionDraft = (id: string, updates: Partial<VersionDraft>) => {
    setVersionDrafts(prev => 
      prev.map(version => 
        version.id === id ? { ...version, ...updates } : version
      )
    )
  }

  const deleteVersionDraft = (id: string) => {
    setVersionDrafts(prev => prev.filter(version => version.id !== id))
  }

  const generateVersion = async (versionId: string) => {
    const version = versionDrafts.find(v => v.id === versionId)
    if (!version || !version.instructions.trim()) return

    updateVersionDraft(versionId, { isGenerating: true })

    try {
      const generationParams: GenerationParams = {
        openaiKey,
        geminiKey,
        aiProvider,
        responseLanguage
      }
      
      const storyVersion: StoryVersion = {
        id: `version-${Date.now()}`,
        title: version.title,
        content: draft.content,
        prompt: version.instructions,
        originalDraftId: draft.id,
        createdAt: new Date().toISOString()
      }
      
      const generatedVersion = await storyGenerationService.generateVersion(
        draft,
        version.instructions,
        generationParams
      )
      
      updateVersionDraft(versionId, {
        content: generatedVersion.content,
        isGenerating: false,
        isGenerated: true
      })
    } catch (error) {
      console.error('Error generating version:', error)
      updateVersionDraft(versionId, { isGenerating: false })
    }
  }

  const saveVersion = (versionId: string) => {
    const version = versionDrafts.find(v => v.id === versionId)
    if (!version || !version.isGenerated) return

    const storyVersion: StoryVersion = {
      id: `version-${Date.now()}`,
      title: version.title,
      content: version.content,
      prompt: version.instructions,
      originalDraftId: draft.id,
      createdAt: new Date().toISOString()
    }

    onSaveVersion(storyVersion)
  }

  const togglePreview = (versionId: string) => {
    setPreviewVersion(prev => prev === versionId ? null : versionId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Story
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Version Editor</h1>
            <p className="text-sm text-gray-500">Creating versions for: {draft.title}</p>
          </div>
        </div>
        <Button
          onClick={addNewVersionDraft}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Version
        </Button>
      </div>

      {/* Original Story Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Original Story</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {draft.content}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Version Drafts */}
      <div className="space-y-4">
        {versionDrafts.map((version, index) => (
          <Card key={version.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Input
                    value={version.title}
                    onChange={(e) => updateVersionDraft(version.id, { title: e.target.value })}
                    className="font-semibold"
                    placeholder="Version title"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {version.isGenerated && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePreview(version.id)}
                        className="flex items-center gap-1"
                      >
                        {previewVersion === version.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        {previewVersion === version.id ? 'Hide' : 'Preview'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCopyToClipboard(version.content)}
                        className="flex items-center gap-1"
                      >
                        <Copy size={14} />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveVersion(version.id)}
                        className="flex items-center gap-1"
                      >
                        <Save size={14} />
                        Save
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteVersionDraft(version.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for AI Generation
                </label>
                <Textarea
                  value={version.instructions}
                  onChange={(e) => updateVersionDraft(version.id, { instructions: e.target.value })}
                  placeholder="Enter instructions for how you want this version to be created (e.g., 'Make it more dramatic', 'Add more dialogue', 'Write in a comedic style')..."
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe how you want the AI to transform or rewrite your story.
                </p>
              </div>

              {/* Generate Button */}
              <div className="flex gap-2">
                <Button
                  onClick={() => generateVersion(version.id)}
                  disabled={version.isGenerating || !version.instructions.trim()}
                  className="flex items-center gap-2"
                >
                  {version.isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Version
                    </>
                  )}
                </Button>
                {version.isGenerated && (
                  <div className="flex items-center text-sm text-green-600">
                    ✓ Version generated
                  </div>
                )}
              </div>

              {/* Preview */}
              {version.isGenerated && previewVersion === version.id && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Generated Content:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {version.content}
                    </pre>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Generated on {dateUtils.formatDate(version.createdAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Versions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific about the style or tone you want (e.g., "more suspenseful", "comedic", "romantic")</li>
            <li>• Request specific changes (e.g., "add more dialogue", "describe the setting in detail")</li>
            <li>• Specify the target audience (e.g., "make it suitable for children", "write for adults")</li>
            <li>• Ask for structural changes (e.g., "tell it from a different perspective", "make it shorter")</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}