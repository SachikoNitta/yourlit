import { Trash2, Wand2, User } from "lucide-react"
import { Button } from "../ui/button"
import { Draft } from "../../lib/draftsStorage"
import { dateUtils } from "../../lib/dateUtils"

interface DraftViewerProps {
  draft: Draft
  onGoBack: () => void
  onDelete: (draftId: string) => void
  onCreateVersion: () => void
  onCopyToClipboard: (content: string) => void
  onExtractCharacters?: () => void
}

export function DraftViewer({ 
  draft, 
  onGoBack, 
  onDelete, 
  onCreateVersion, 
  onCopyToClipboard,
  onExtractCharacters
}: DraftViewerProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onGoBack}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to stories
        </button>
        <button
          onClick={() => onDelete(draft.id)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          title="Delete story"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div>
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
      </div>
      
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
    </div>
  )
}