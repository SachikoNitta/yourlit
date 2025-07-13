// Repository layer types and interfaces

export interface TreeData {
  id: string
  title: string
  createdAt: string
  lastModified: string
}

export interface TreeNode {
  id: string
  question?: string
  answer?: string
  parentId?: string
  showQuestionInput?: boolean
  showEditInput?: boolean
  isGenerating?: boolean
}

export interface StoryDraft {
  id: string
  title: string
  content: string
  createdAt: string
  nodeId: string
}

export interface StoryVersion {
  id: string
  draftId: string
  title: string
  content: string
  instructions: string
  createdAt: string
}

export interface UserPreferences {
  currentTreeId?: string
  editorMode?: 'advanced' | 'simple'
  lastAccessedTreeId?: string
}

// Repository interfaces
export interface TreeRepository {
  // Tree metadata operations
  createTree(tree: Omit<TreeData, 'id'>): Promise<TreeData>
  getTree(id: string): Promise<TreeData | null>
  getAllTrees(): Promise<TreeData[]>
  updateTree(id: string, updates: Partial<TreeData>): Promise<void>
  deleteTree(id: string): Promise<void>
  
  // Tree nodes operations
  saveTreeNodes(treeId: string, nodes: TreeNode[]): Promise<void>
  getTreeNodes(treeId: string): Promise<TreeNode[]>
  addNode(treeId: string, node: TreeNode): Promise<void>
  updateNode(treeId: string, nodeId: string, updates: Partial<TreeNode>): Promise<void>
  deleteNode(treeId: string, nodeId: string): Promise<void>
}

export interface StoryRepository {
  // Story drafts operations
  createDraft(draft: Omit<StoryDraft, 'id'>): Promise<StoryDraft>
  getDraft(id: string): Promise<StoryDraft | null>
  getAllDrafts(): Promise<StoryDraft[]>
  updateDraft(id: string, updates: Partial<StoryDraft>): Promise<void>
  deleteDraft(id: string): Promise<void>
  
  // Story versions operations
  createVersion(version: Omit<StoryVersion, 'id'>): Promise<StoryVersion>
  getVersion(id: string): Promise<StoryVersion | null>
  getVersionsForDraft(draftId: string): Promise<StoryVersion[]>
  getAllVersions(): Promise<StoryVersion[]>
  updateVersion(id: string, updates: Partial<StoryVersion>): Promise<void>
  deleteVersion(id: string): Promise<void>
}

export interface UserRepository {
  // User preferences operations
  getPreferences(): Promise<UserPreferences>
  setPreferences(preferences: Partial<UserPreferences>): Promise<void>
  getCurrentTreeId(): Promise<string | null>
  setCurrentTreeId(treeId: string): Promise<void>
  clearCurrentTreeId(): Promise<void>
}

export interface RepositoryFactory {
  createTreeRepository(): TreeRepository
  createStoryRepository(): StoryRepository
  createUserRepository(): UserRepository
}