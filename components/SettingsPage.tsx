"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { LANGUAGES } from "@/lib/settings"
import { testFirebaseConnection } from "@/lib/repositories/firestore"

interface SettingsPageProps {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  defaultNumAnswers: number
  defaultResponseLength: 'short' | 'medium' | 'long'
  storageType: 'localStorage' | 'firestore'
  firebaseApiKey: string
  firebaseProjectId: string
  isHydrated: boolean
  onOpenaiKeyChange: (key: string) => void
  onGeminiKeyChange: (key: string) => void
  onAiProviderChange: (provider: 'openai' | 'gemini') => void
  onResponseLanguageChange: (language: string) => void
  onDefaultNumAnswersChange: (count: number) => void
  onDefaultResponseLengthChange: (length: 'short' | 'medium' | 'long') => void
  onStorageTypeChange: (storageType: 'localStorage' | 'firestore') => void
  onFirebaseApiKeyChange: (key: string) => void
  onFirebaseProjectIdChange: (projectId: string) => void
}

export function SettingsPage({
  openaiKey,
  geminiKey,
  aiProvider,
  responseLanguage,
  defaultNumAnswers,
  defaultResponseLength,
  storageType,
  firebaseApiKey,
  firebaseProjectId,
  isHydrated,
  onOpenaiKeyChange,
  onGeminiKeyChange,
  onAiProviderChange,
  onResponseLanguageChange,
  onDefaultNumAnswersChange,
  onDefaultResponseLengthChange,
  onStorageTypeChange,
  onFirebaseApiKeyChange,
  onFirebaseProjectIdChange
}: SettingsPageProps) {
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const handleTestConnection = async () => {
    setConnectionTest({ status: 'testing', message: 'Testing connection...' })
    
    try {
      const result = await testFirebaseConnection({
        firebaseApiKey,
        firebaseProjectId,
        storageType,
        openaiKey: '',
        geminiKey: '',
        aiProvider: 'openai',
        responseLanguage: 'en',
        defaultNumAnswers: 3,
        defaultResponseLength: 'medium'
      })
      
      setConnectionTest({
        status: result.success ? 'success' : 'error',
        message: result.message
      })
      
      // Clear the message after 5 seconds
      setTimeout(() => {
        setConnectionTest({ status: 'idle', message: '' })
      }, 5000)
    } catch (error) {
      setConnectionTest({
        status: 'error',
        message: 'Failed to test connection'
      })
    }
  }

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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Storage Type
            </label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="storageType"
                  value="localStorage"
                  checked={storageType === 'localStorage'}
                  onChange={(e) => onStorageTypeChange(e.target.value as 'localStorage' | 'firestore')}
                  className="mr-2"
                />
                Browser Storage (Local)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="storageType"
                  value="firestore"
                  checked={storageType === 'firestore'}
                  onChange={(e) => onStorageTypeChange(e.target.value as 'localStorage' | 'firestore')}
                  className="mr-2"
                />
                Cloud Storage (Firestore)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose where to store your trees and stories
            </p>
          </div>
          
          {storageType === 'firestore' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Firebase API Key
                </label>
                <Input
                  type="password"
                  value={firebaseApiKey}
                  onChange={(e) => onFirebaseApiKeyChange(e.target.value)}
                  placeholder="Enter your Firebase API key"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found in Firebase Console → Project Settings → General → Web API Key
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Firebase Project ID
                </label>
                <Input
                  type="text"
                  value={firebaseProjectId}
                  onChange={(e) => onFirebaseProjectIdChange(e.target.value)}
                  placeholder="your-project-id"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found in Firebase Console → Project Settings → General → Project ID
                </p>
              </div>
              
              <div>
                <Button
                  onClick={handleTestConnection}
                  disabled={!firebaseApiKey || !firebaseProjectId || connectionTest.status === 'testing'}
                  className="w-full"
                  variant="outline"
                >
                  {connectionTest.status === 'testing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    'Test Firebase Connection'
                  )}
                </Button>
                
                {connectionTest.status !== 'idle' && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                    connectionTest.status === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : connectionTest.status === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}>
                    {connectionTest.status === 'success' && <CheckCircle className="h-4 w-4" />}
                    {connectionTest.status === 'error' && <XCircle className="h-4 w-4" />}
                    {connectionTest.status === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="text-sm">{connectionTest.message}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Firestore Setup Required:</strong> Make sure to:
                  <br />• Create a Firestore database in your Firebase project
                  <br />• Set appropriate security rules for your collections
                  <br />• Enable Firestore in your Firebase Console
                  <br />• Use the "Test Connection" button above to verify setup
                </p>
              </div>
            </>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {storageType === 'localStorage' 
                ? "Your data is stored locally in your browser. It won't sync across devices but is completely private."
                : "Your data is stored in Firebase Firestore. It will sync across devices but requires proper Firebase setup."
              }
              <br />Your API keys are always stored locally for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}