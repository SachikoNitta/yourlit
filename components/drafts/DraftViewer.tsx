import { useState } from "react"
import { Trash2, Wand2, User, Edit, Save, X } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Draft } from "../../lib/draftsStorage"
import { dateUtils } from "../../lib/dateUtils"
import { StoryCharactersList } from "../story-characters/StoryCharactersList"

interface DraftViewerProps {
  draft: Draft
  onGoBack: () => void
  onDelete: (draftId: string) => void
  onCreateVersion: () => void
  onCopyToClipboard: (content: string) => void
  onExtractCharacters?: () => void
  onUpdateDraft?: (draftId: string, updates: { title?: string; content?: string }) => void
}

export function DraftViewer({ 
  draft, 
  onGoBack, 
  onDelete, 
  onCreateVersion, 
  onCopyToClipboard,
  onExtractCharacters,
  onUpdateDraft
}: DraftViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(draft.title)
  const [editContent, setEditContent] = useState(draft.content)

  const handleSave = () => {
    if (onUpdateDraft) {
      onUpdateDraft(draft.id, {
        title: editTitle,
        content: editContent
      })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(draft.title)
    setEditContent(draft.content)
    setIsEditing(false)
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onGoBack}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to stories
        </button>
        <div className="flex items-center gap-2">
          {onUpdateDraft && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title={isEditing ? "Cancel edit" : "Edit story"}
            >
              {isEditing ? <X size={16} /> : <Edit size={16} />}
            </button>
          )}
          <button
            onClick={() => onDelete(draft.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            title="Delete story"
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
                placeholder="Story title"
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
                placeholder="Story content"
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
              {draft.title}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Saved on {dateUtils.formatDate(draft.createdAt)}
            </p>
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {draft.content}
              </pre>
            </div>
          </>
        )}
      </div>
      
      {!isEditing && (
        <div className="flex gap-3">
          <Button
            onClick={onCreateVersion}
            className="flex items-center gap-2"
          >
            <Wand2 size={16} />
            Create Version
          </Button>
          {onExtractCharacters && (
            <Button
              onClick={onExtractCharacters}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User size={16} />
              Extract Characters
            </Button>
          )}
          <Button
            onClick={() => onCopyToClipboard(draft.content)}
            variant="outline"
          >
            Copy to Clipboard
          </Button>
        </div>
      )}
      
      {!isEditing && <StoryCharactersList storyId={draft.id} />}
    </div>
  )
}