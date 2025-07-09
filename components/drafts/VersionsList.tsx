import { Trash2 } from "lucide-react"
import { StoryVersion } from "../../lib/draftsStorage"
import { dateUtils } from "../../lib/dateUtils"

interface VersionsListProps {
  versions: StoryVersion[]
  onSelectVersion: (version: StoryVersion) => void
  onDeleteVersion: (versionId: string) => void
}

export function VersionsList({ versions, onSelectVersion, onDeleteVersion }: VersionsListProps) {
  if (versions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No versions created yet. Create your first version above.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <div
          key={version.id}
          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelectVersion(version)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm truncate">
                {version.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {version.prompt && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {dateUtils.truncateText(version.prompt, 20)}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {dateUtils.formatDate(version.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteVersion(version.id)
              }}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-3"
              title="Delete version"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}