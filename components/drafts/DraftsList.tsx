import { Trash2 } from "lucide-react"
import { Draft } from "../../lib/draftsStorage"
import { dateUtils } from "../../lib/dateUtils"

interface DraftsListProps {
  drafts: Draft[]
  onSelectDraft: (draft: Draft) => void
  onDeleteDraft: (draftId: string) => void
}

export function DraftsList({ drafts, onSelectDraft, onDeleteDraft }: DraftsListProps) {
  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No saved stories yet. Save a story thread to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <div
          key={draft.id}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelectDraft(draft)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-lg truncate">
                {draft.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {dateUtils.formatDate(draft.createdAt)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteDraft(draft.id)
              }}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-3"
              title="Delete story"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}