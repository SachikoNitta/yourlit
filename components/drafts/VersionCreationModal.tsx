import { useState } from "react"
import { Wand2, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { Draft } from "../../lib/draftsStorage"

interface VersionCreationModalProps {
  isVisible: boolean
  draft: Draft | null
  isGenerating: boolean
  onClose: () => void
  onGenerate: (instructions: string) => Promise<void>
}

export function VersionCreationModal({ 
  isVisible, 
  draft, 
  isGenerating, 
  onClose, 
  onGenerate 
}: VersionCreationModalProps) {
  const [instructions, setInstructions] = useState('')

  const handleClose = () => {
    setInstructions('')
    onClose()
  }

  const handleGenerate = async () => {
    if (!instructions.trim()) return
    await onGenerate(instructions.trim())
    setInstructions('')
  }

  if (!isVisible || !draft) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Create Version</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions for Version
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter instructions for how you want this version to be created (e.g., 'Make it more dramatic', 'Add more dialogue', 'Write in a comedic style')..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe how you want the AI to transform or rewrite your story.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">Preview:</h4>
            <p className="text-xs text-gray-600 break-words">
              {draft.title}
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || !instructions.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                Generate Version
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}