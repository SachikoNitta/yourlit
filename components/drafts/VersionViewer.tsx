import { Trash2, User } from "lucide-react"
import { Button } from "../ui/button"
import { StoryVersion } from "../../lib/draftsStorage"
import { dateUtils } from "../../lib/dateUtils"

interface VersionViewerProps {
  version: StoryVersion
  onGoBack: () => void
  onDelete: (versionId: string) => void
  onCopyToClipboard: (content: string) => void
  onExtractCharacters?: () => void
}

export function VersionViewer({ 
  version, 
  onGoBack, 
  onDelete, 
  onCopyToClipboard,
  onExtractCharacters
}: VersionViewerProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onGoBack}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to story
        </button>
        <button
          onClick={() => onDelete(version.id)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          title="Delete version"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div>
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
      </div>
      
      <div className="flex gap-3">
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
        <Button onClick={() => onCopyToClipboard(version.content)}>
          Copy to Clipboard
        </Button>
      </div>
    </div>
  )
}