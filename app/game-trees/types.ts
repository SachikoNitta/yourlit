export interface TreeNode {
  id: string
  question?: string
  answer?: string
  parentId?: string
  isGenerating?: boolean
  showQuestionInput?: boolean
  showEditInput?: boolean
}


export interface NodeProps {
  node: TreeNode
  level: number
  allNodes: TreeNode[]
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  defaultNumAnswers: number
  defaultResponseLength: 'short' | 'medium' | 'long'
  onUpdateNode: (nodeId: string, updates: Partial<TreeNode>) => void
  onAddNodes: (nodes: TreeNode[]) => void
  onDeleteNode: (nodeId: string) => void
  onClearQuestion: (nodeId: string) => void
}

export interface SettingsProps {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  isHydrated: boolean
  onOpenaiKeyChange: (key: string) => void
  onGeminiKeyChange: (key: string) => void
  onAiProviderChange: (provider: 'openai' | 'gemini') => void
  onResponseLanguageChange: (language: string) => void
}