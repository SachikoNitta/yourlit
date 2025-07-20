export interface EmotionStep {
  tone: string
  label: string
  duration: number
}

export interface EmotionCode {
  id: string
  name: string
  steps: EmotionStep[]
  tags: string[]
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export const emotionCodesStorage = {
  // Emotion codes operations
  loadEmotionCodes(): EmotionCode[] {
    try {
      const codes = localStorage.getItem('emotion-codes')
      return codes ? JSON.parse(codes) : []
    } catch (error) {
      console.error('Error loading emotion codes:', error)
      return []
    }
  },

  saveEmotionCodes(codes: EmotionCode[]): void {
    try {
      localStorage.setItem('emotion-codes', JSON.stringify(codes))
    } catch (error) {
      console.error('Error saving emotion codes:', error)
    }
  },

  addEmotionCode(code: Omit<EmotionCode, 'id' | 'createdAt' | 'updatedAt'>): EmotionCode {
    const newCode: EmotionCode = {
      ...code,
      id: `emotion-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const codes = this.loadEmotionCodes()
    const updatedCodes = [newCode, ...codes]
    this.saveEmotionCodes(updatedCodes)
    
    return newCode
  },

  updateEmotionCode(id: string, updates: Partial<Omit<EmotionCode, 'id' | 'createdAt'>>): EmotionCode[] {
    const codes = this.loadEmotionCodes()
    const updatedCodes = codes.map(code => 
      code.id === id 
        ? { ...code, ...updates, updatedAt: new Date().toISOString() }
        : code
    )
    this.saveEmotionCodes(updatedCodes)
    return updatedCodes
  },

  deleteEmotionCode(id: string): EmotionCode[] {
    const codes = this.loadEmotionCodes()
    const updatedCodes = codes.filter(code => code.id !== id)
    this.saveEmotionCodes(updatedCodes)
    return updatedCodes
  },

  setActiveEmotionCode(id: string): EmotionCode[] {
    const codes = this.loadEmotionCodes()
    const updatedCodes = codes.map(code => ({
      ...code,
      isActive: code.id === id,
      updatedAt: code.id === id ? new Date().toISOString() : code.updatedAt
    }))
    this.saveEmotionCodes(updatedCodes)
    return updatedCodes
  },

  getActiveEmotionCode(): EmotionCode | null {
    const codes = this.loadEmotionCodes()
    return codes.find(code => code.isActive) || null
  },

  duplicateEmotionCode(id: string): EmotionCode | null {
    const codes = this.loadEmotionCodes()
    const originalCode = codes.find(code => code.id === id)
    
    if (!originalCode) return null
    
    const duplicatedCode: EmotionCode = {
      ...originalCode,
      id: `emotion-${Date.now()}`,
      name: `${originalCode.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false
    }
    
    const updatedCodes = [duplicatedCode, ...codes]
    this.saveEmotionCodes(updatedCodes)
    
    return duplicatedCode
  }
}

// Predefined emotion code templates
export const emotionCodeTemplates: Omit<EmotionCode, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>[] = [
  {
    name: "Gentle Storm",
    steps: [
      { tone: "calm", label: "穏やか", duration: 1 },
      { tone: "thrill", label: "スリル", duration: 2 },
      { tone: "tension", label: "緊張", duration: 1 },
      { tone: "emotional", label: "感動", duration: 1 },
      { tone: "calm", label: "落ち着き", duration: 1 }
    ],
    tags: ["emotional", "classic", "safe-return"]
  },
  {
    name: "Hero's Journey",
    steps: [
      { tone: "calm", label: "日常", duration: 1 },
      { tone: "curiosity", label: "冒険の誘い", duration: 1 },
      { tone: "tension", label: "試練", duration: 2 },
      { tone: "dark", label: "絶望", duration: 1 },
      { tone: "hope", label: "希望", duration: 1 },
      { tone: "triumph", label: "勝利", duration: 1 },
      { tone: "calm", label: "帰還", duration: 1 }
    ],
    tags: ["adventure", "classic", "journey"]
  },
  {
    name: "Romance Arc",
    steps: [
      { tone: "curiosity", label: "出会い", duration: 1 },
      { tone: "sweet", label: "親しみ", duration: 2 },
      { tone: "tension", label: "葛藤", duration: 1 },
      { tone: "dark", label: "別れ", duration: 1 },
      { tone: "emotional", label: "再会", duration: 1 },
      { tone: "sweet", label: "結ばれる", duration: 1 }
    ],
    tags: ["romance", "emotional", "relationship"]
  },
  {
    name: "Mystery Thriller",
    steps: [
      { tone: "curiosity", label: "謎の始まり", duration: 1 },
      { tone: "tension", label: "手がかり", duration: 2 },
      { tone: "dark", label: "危険", duration: 2 },
      { tone: "thrill", label: "追跡", duration: 1 },
      { tone: "revelation", label: "真実", duration: 1 },
      { tone: "calm", label: "解決", duration: 1 }
    ],
    tags: ["mystery", "thriller", "suspense"]
  },
  {
    name: "Comedy Rising",
    steps: [
      { tone: "light", label: "軽やか", duration: 1 },
      { tone: "funny", label: "おかしな出来事", duration: 2 },
      { tone: "chaos", label: "大混乱", duration: 2 },
      { tone: "funny", label: "笑いの頂点", duration: 1 },
      { tone: "sweet", label: "ほっこり", duration: 1 }
    ],
    tags: ["comedy", "light", "fun"]
  }
]

// Available emotion tones
export const emotionTones = [
  { value: "calm", label: "穏やか" },
  { value: "thrill", label: "スリル" },
  { value: "tension", label: "緊張" },
  { value: "emotional", label: "感動" },
  { value: "dark", label: "暗い" },
  { value: "hope", label: "希望" },
  { value: "triumph", label: "勝利" },
  { value: "curiosity", label: "好奇心" },
  { value: "sweet", label: "甘い" },
  { value: "light", label: "軽やか" },
  { value: "funny", label: "面白い" },
  { value: "chaos", label: "混乱" },
  { value: "revelation", label: "暴露" },
  { value: "melancholy", label: "憂鬱" },
  { value: "excitement", label: "興奮" },
  { value: "peaceful", label: "平和" },
  { value: "nostalgic", label: "懐かしい" },
  { value: "mysterious", label: "神秘的" }
]