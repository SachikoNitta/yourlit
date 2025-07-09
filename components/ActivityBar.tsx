"use client"

import { Settings, FileText, Trees } from "lucide-react"

interface ActivityBarProps {
  onShowTrees?: () => void
  onShowSettings?: () => void
  onShowStories?: () => void
}

export function ActivityBar({
  onShowTrees,
  onShowSettings,
  onShowStories
}: ActivityBarProps) {


  return (
    <div className="fixed left-0 top-0 h-full z-50 flex">
      <div className="w-12 bg-gray-800 flex flex-col items-center py-4 gap-2">
        <button
          onClick={onShowTrees}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <Trees size={20} />
        </button>
        <button
          onClick={onShowStories}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <FileText size={20} />
        </button>
        <button
          onClick={onShowSettings}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  )
}