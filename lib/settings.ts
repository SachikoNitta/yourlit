// Storage keys for settings
const OPENAI_API_KEY_STORAGE_KEY = 'openai-api-key'
const GEMINI_API_KEY_STORAGE_KEY = 'gemini-api-key'
const AI_PROVIDER_STORAGE_KEY = 'ai-provider'
const RESPONSE_LANGUAGE_STORAGE_KEY = 'response-language'
const DEFAULT_NUM_ANSWERS_STORAGE_KEY = 'default-num-answers'
const DEFAULT_RESPONSE_LENGTH_STORAGE_KEY = 'default-response-length'
const STORAGE_TYPE_STORAGE_KEY = 'storage-type'
const FIREBASE_API_KEY_STORAGE_KEY = 'firebase-api-key'
const FIREBASE_PROJECT_ID_STORAGE_KEY = 'firebase-project-id'

// Language options for responses
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
]

export interface AppSettings {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  defaultNumAnswers: number
  defaultResponseLength: 'short' | 'medium' | 'long'
  storageType: 'localStorage' | 'firestore'
  firebaseApiKey: string
  firebaseProjectId: string
}

export const getDefaultSettings = (): AppSettings => ({
  openaiKey: '',
  geminiKey: '',
  aiProvider: 'openai',
  responseLanguage: 'en',
  defaultNumAnswers: 3,
  defaultResponseLength: 'medium',
  storageType: 'localStorage',
  firebaseApiKey: '',
  firebaseProjectId: ''
})

export const loadSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return getDefaultSettings()
  }

  return {
    openaiKey: localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '',
    geminiKey: localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '',
    aiProvider: (localStorage.getItem(AI_PROVIDER_STORAGE_KEY) as 'openai' | 'gemini') || 'openai',
    responseLanguage: localStorage.getItem(RESPONSE_LANGUAGE_STORAGE_KEY) || 'en',
    defaultNumAnswers: parseInt(localStorage.getItem(DEFAULT_NUM_ANSWERS_STORAGE_KEY) || '3'),
    defaultResponseLength: (localStorage.getItem(DEFAULT_RESPONSE_LENGTH_STORAGE_KEY) as 'short' | 'medium' | 'long') || 'medium',
    storageType: (localStorage.getItem(STORAGE_TYPE_STORAGE_KEY) as 'localStorage' | 'firestore') || 'localStorage',
    firebaseApiKey: localStorage.getItem(FIREBASE_API_KEY_STORAGE_KEY) || '',
    firebaseProjectId: localStorage.getItem(FIREBASE_PROJECT_ID_STORAGE_KEY) || ''
  }
}

export const saveSettings = (settings: Partial<AppSettings>): void => {
  if (typeof window === 'undefined') return

  if (settings.openaiKey !== undefined) {
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, settings.openaiKey)
  }
  if (settings.geminiKey !== undefined) {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, settings.geminiKey)
  }
  if (settings.aiProvider !== undefined) {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, settings.aiProvider)
  }
  if (settings.responseLanguage !== undefined) {
    localStorage.setItem(RESPONSE_LANGUAGE_STORAGE_KEY, settings.responseLanguage)
  }
  if (settings.defaultNumAnswers !== undefined) {
    localStorage.setItem(DEFAULT_NUM_ANSWERS_STORAGE_KEY, settings.defaultNumAnswers.toString())
  }
  if (settings.defaultResponseLength !== undefined) {
    localStorage.setItem(DEFAULT_RESPONSE_LENGTH_STORAGE_KEY, settings.defaultResponseLength)
  }
  if (settings.storageType !== undefined) {
    localStorage.setItem(STORAGE_TYPE_STORAGE_KEY, settings.storageType)
  }
  if (settings.firebaseApiKey !== undefined) {
    localStorage.setItem(FIREBASE_API_KEY_STORAGE_KEY, settings.firebaseApiKey)
  }
  if (settings.firebaseProjectId !== undefined) {
    localStorage.setItem(FIREBASE_PROJECT_ID_STORAGE_KEY, settings.firebaseProjectId)
  }
}

export const getApiKey = (settings: AppSettings): string => {
  return settings.aiProvider === 'openai' ? settings.openaiKey : settings.geminiKey
}