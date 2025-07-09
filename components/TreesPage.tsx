"use client"

import { useState } from "react"
import { Trash2, Plus, Send, AlertTriangle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TreesPageProps {
  trees: any[]
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  isHydrated: boolean
  onCreateTree: (question: string) => void
  onSelectTree: (treeId: string) => void
  onDeleteTree: (treeId: string) => void
  onGoToSettings: () => void
}

export function TreesPage({
  trees,
  openaiKey,
  geminiKey,
  aiProvider,
  isHydrated,
  onCreateTree,
  onSelectTree,
  onDeleteTree,
  onGoToSettings
}: TreesPageProps) {
  const [newTreeQuestion, setNewTreeQuestion] = useState("")

  const hasApiKey = () => {
    if (aiProvider === 'openai') {
      const hasKey = openaiKey && openaiKey.startsWith('sk-')
      console.log('🔑 API Key check (OpenAI):', { 
        openaiKey: openaiKey ? openaiKey.substring(0, 8) + '...' : 'none',
        hasKey,
        isHydrated
      })
      return hasKey
    } else {
      const hasKey = geminiKey && geminiKey.trim().length > 0
      console.log('🔑 API Key check (Gemini):', { 
        geminiKey: geminiKey ? geminiKey.substring(0, 8) + '...' : 'none',
        hasKey,
        isHydrated
      })
      return hasKey
    }
  }

  const handleCreateTree = () => {
    if (newTreeQuestion.trim()) {
      onCreateTree(newTreeQuestion.trim())
      setNewTreeQuestion("")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="ml-12 w-[calc(100vw-3rem)] p-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Story Trees</h1>
        
        {/* API Key Warning - Outside Create New Tree section */}
        {isHydrated && !hasApiKey() && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 mb-1">
                  API Key Required
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  You need to set up an {aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key to generate AI responses. 
                  Without an API key, you can create trees but won't be able to generate story content.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onGoToSettings}
                  className="bg-white hover:bg-amber-50 text-amber-800 border-amber-300"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Create New Tree */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Create New Tree</h2>
          <div className="space-y-4">
            <Input
              value={newTreeQuestion}
              onChange={(e) => setNewTreeQuestion(e.target.value)}
              placeholder="Ask a question or start a story to begin a new tree..."
              className="text-sm"
            />
            <Button 
              onClick={handleCreateTree} 
              disabled={!newTreeQuestion.trim()}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Tree
            </Button>
          </div>
        </div>

        {/* Trees List */}
        <div className="space-y-4">
          {trees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No story trees yet. Create your first tree above to get started.
              </p>
            </div>
          ) : (
            trees.map((tree) => (
              <div
                key={tree.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectTree(tree.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-lg truncate">
                      {tree.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created on {formatDate(tree.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteTree(tree.id)
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-3"
                    title="Delete tree"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}