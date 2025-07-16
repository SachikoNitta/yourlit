import { useState } from "react"
import { Trash2, Edit, Save, X } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { StoryVersion } from "../../lib/draftsStorage"
import { dateUtils } from "../../lib/dateUtils"

interface VersionViewerProps {
  version: StoryVersion
  onGoBack: () => void
  onDelete: (versionId: string) => void
  onCopyToClipboard: (content: string) => void
  onUpdateVersion?: (versionId: string, updates: { title?: string; content?: string; prompt?: string }) => void
}

export function VersionViewer({ 
  version, 
  onGoBack, 
  onDelete, 
  onCopyToClipboard,
  onUpdateVersion
}: VersionViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(version.title)
  const [editContent, setEditContent] = useState(version.content)
  const [editPrompt, setEditPrompt] = useState(version.prompt)

  const handleSave = () => {
    if (onUpdateVersion) {
      onUpdateVersion(version.id, {
        title: editTitle,
        content: editContent,
        prompt: editPrompt
      })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(version.title)
    setEditContent(version.content)
    setEditPrompt(version.prompt)
    setIsEditing(false)
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onGoBack}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to story
        </button>
        <div className="flex items-center gap-2">
          {onUpdateVersion && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title={isEditing ? "Cancel edit" : "Edit version"}
            >
              {isEditing ? <X size={16} /> : <Edit size={16} />}
            </button>
          )}
          <button
            onClick={() => onDelete(version.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            title="Delete version"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold"
                placeholder="Version title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions/Prompt
              </label>
              <Input
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Generation instructions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[400px] text-sm leading-relaxed font-mono"
                placeholder="Version content"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save size={16} />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">
              {version.title}
            </h1>
            <div className="flex items-center gap-3 mb-6">
              {version.prompt && (
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {dateUtils.truncateText(version.prompt, 30)}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {dateUtils.formatDate(version.createdAt)}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {version.content}
              </pre>
            </div>
          </>
        )}
      </div>
      
      {!isEditing && (
        <div className="flex gap-3">
          <Button onClick={() => onCopyToClipboard(version.content)}>
            Copy to Clipboard
          </Button>
        </div>
      )}
    </div>
  )
}