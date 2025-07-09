import { 
  OPENAI_API_KEY_STORAGE_KEY, 
  GEMINI_API_KEY_STORAGE_KEY, 
  AI_PROVIDER_STORAGE_KEY,
  RESPONSE_LANGUAGE_STORAGE_KEY,
  DEFAULT_NUM_ANSWERS_STORAGE_KEY,
  DEFAULT_RESPONSE_LENGTH_STORAGE_KEY
} from '../app/game-trees/constants'

export interface AppSettings {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  defaultNumAnswers: number
  defaultResponseLength: 'short' | 'medium' | 'long'
}

export const getDefaultSettings = (): AppSettings => ({
  openaiKey: '',
  geminiKey: '',
  aiProvider: 'openai',
  responseLanguage: 'en',
  defaultNumAnswers: 3,
  defaultResponseLength: 'medium'
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
    defaultResponseLength: (localStorage.getItem(DEFAULT_RESPONSE_LENGTH_STORAGE_KEY) as 'short' | 'medium' | 'long') || 'medium'
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
}

export const getApiKey = (settings: AppSettings): string => {
  return settings.aiProvider === 'openai' ? settings.openaiKey : settings.geminiKey
}