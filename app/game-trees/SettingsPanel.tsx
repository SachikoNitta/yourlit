"use client"

import { Input } from "@/components/ui/input"
import { SettingsProps } from './types'
import { LANGUAGES } from './constants'

export function SettingsPanel({
  openaiKey,
  geminiKey,
  aiProvider,
  responseLanguage,
  isHydrated,
  onOpenaiKeyChange,
  onGeminiKeyChange,
  onAiProviderChange,
  onResponseLanguageChange
}: SettingsProps) {
  return (
    <div className="mb-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Provider
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="aiProvider"
                value="openai"
                checked={aiProvider === 'openai'}
                onChange={(e) => onAiProviderChange(e.target.value as 'openai' | 'gemini')}
                className="mr-2"
              />
              OpenAI
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="aiProvider"
                value="gemini"
                checked={aiProvider === 'gemini'}
                onChange={(e) => onAiProviderChange(e.target.value as 'openai' | 'gemini')}
                className="mr-2"
              />
              Gemini
            </label>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <Input
            type="password"
            value={openaiKey}
            onChange={(e) => onOpenaiKeyChange(e.target.value)}
            placeholder="Enter your OpenAI API key (sk-...)"
            className="w-full"
            disabled={!isHydrated ? false : aiProvider !== 'openai'}
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <Input
            type="password"
            value={geminiKey}
            onChange={(e) => onGeminiKeyChange(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full"
            disabled={!isHydrated ? false : aiProvider !== 'gemini'}
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Language
          </label>
          <select
            value={responseLanguage}
            onChange={(e) => onResponseLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <p className="text-xs text-gray-500">
          Your API keys are stored locally and used to generate AI responses. Language setting affects AI response language.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">AI Story Tree</h2>
        <p className="text-gray-600 text-sm">
          <span className="text-blue-600">User questions</span> and <span className="text-gray-800">AI answers</span> -
          Click "Add question" to continue any path. Use the red X buttons to delete unwanted branches.
        </p>
      </div>
    </div>
  )
}