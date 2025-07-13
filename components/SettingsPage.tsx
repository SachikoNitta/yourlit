"use client"

import { Input } from "@/components/ui/input"
import { LANGUAGES } from "@/lib/settings"

interface SettingsPageProps {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  defaultNumAnswers: number
  defaultResponseLength: 'short' | 'medium' | 'long'
  isHydrated: boolean
  onOpenaiKeyChange: (key: string) => void
  onGeminiKeyChange: (key: string) => void
  onAiProviderChange: (provider: 'openai' | 'gemini') => void
  onResponseLanguageChange: (language: string) => void
  onDefaultNumAnswersChange: (count: number) => void
  onDefaultResponseLengthChange: (length: 'short' | 'medium' | 'long') => void
}

export function SettingsPage({
  openaiKey,
  geminiKey,
  aiProvider,
  responseLanguage,
  defaultNumAnswers,
  defaultResponseLength,
  isHydrated,
  onOpenaiKeyChange,
  onGeminiKeyChange,
  onAiProviderChange,
  onResponseLanguageChange,
  onDefaultNumAnswersChange,
  onDefaultResponseLengthChange
}: SettingsPageProps) {
  return (
    <div className="ml-12 w-[calc(100vw-3rem)] p-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              AI Provider
            </label>
            <div className="flex gap-6">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default Number of Responses
            </label>
            <Input
              type="number"
              value={defaultNumAnswers}
              onChange={(e) => onDefaultNumAnswersChange(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
              min="1"
              max="5"
              className="w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many response options to generate by default (1-5)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default Response Length
            </label>
            <select
              value={defaultResponseLength}
              onChange={(e) => onDefaultResponseLengthChange(e.target.value as 'short' | 'medium' | 'long')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="short">Short (1-2 sentences)</option>
              <option value="medium">Medium (2-4 sentences)</option>
              <option value="long">Long (4-8 sentences)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Default length for AI responses
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your API keys are stored locally in your browser and are used to generate AI responses. 
              The language setting affects the language in which AI provides responses.
              Default settings will be used as initial values when asking questions or generating stories.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}