// LocalStorage implementation of repositories

import { 
  TreeRepository, 
  StoryRepository, 
  UserRepository, 
  TreeData, 
  TreeNode, 
  StoryDraft, 
  StoryVersion, 
  UserPreferences 
} from './types'

export class LocalStorageTreeRepository implements TreeRepository {
  private readonly TREES_KEY = 'story-trees'
  private readonly TREE_NODES_PREFIX = 'tree-'

  async createTree(tree: Omit<TreeData, 'id'>): Promise<TreeData> {
    const newTree: TreeData = {
      ...tree,
      id: `tree-${Date.now()}`,
      lastModified: new Date().toISOString()
    }

    const trees = await this.getAllTrees()
    const updatedTrees = [newTree, ...trees]
    localStorage.setItem(this.TREES_KEY, JSON.stringify(updatedTrees))
    
    return newTree
  }

  async getTree(id: string): Promise<TreeData | null> {
    const trees = await this.getAllTrees()
    return trees.find(tree => tree.id === id) || null
  }

  async getAllTrees(): Promise<TreeData[]> {
    const treesData = localStorage.getItem(this.TREES_KEY)
    return treesData ? JSON.parse(treesData) : []
  }

  async updateTree(id: string, updates: Partial<TreeData>): Promise<void> {
    const trees = await this.getAllTrees()
    const updatedTrees = trees.map(tree => 
      tree.id === id 
        ? { ...tree, ...updates, lastModified: new Date().toISOString() }
        : tree
    )
    localStorage.setItem(this.TREES_KEY, JSON.stringify(updatedTrees))
  }

  async deleteTree(id: string): Promise<void> {
    const trees = await this.getAllTrees()
    const updatedTrees = trees.filter(tree => tree.id !== id)
    localStorage.setItem(this.TREES_KEY, JSON.stringify(updatedTrees))
    localStorage.removeItem(`${this.TREE_NODES_PREFIX}${id}`)
  }

  async saveTreeNodes(treeId: string, nodes: TreeNode[]): Promise<void> {
    // Deduplicate nodes
    const deduplicatedNodes = nodes.filter((node, index, array) => 
      array.findIndex(n => n.id === node.id) === index
    )
    localStorage.setItem(`${this.TREE_NODES_PREFIX}${treeId}`, JSON.stringify(deduplicatedNodes))
  }

  async getTreeNodes(treeId: string): Promise<TreeNode[]> {
    const nodesData = localStorage.getItem(`${this.TREE_NODES_PREFIX}${treeId}`)
    return nodesData ? JSON.parse(nodesData) : []
  }

  async addNode(treeId: string, node: TreeNode): Promise<void> {
    const existingNodes = await this.getTreeNodes(treeId)
    const updatedNodes = [...existingNodes, node]
    await this.saveTreeNodes(treeId, updatedNodes)
  }

  async updateNode(treeId: string, nodeId: string, updates: Partial<TreeNode>): Promise<void> {
    const nodes = await this.getTreeNodes(treeId)
    const updatedNodes = nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    )
    await this.saveTreeNodes(treeId, updatedNodes)
  }

  async deleteNode(treeId: string, nodeId: string): Promise<void> {
    const nodes = await this.getTreeNodes(treeId)
    
    // Get all descendant nodes to delete
    const getDescendants = (parentId: string): string[] => {
      const directChildren = nodes.filter(n => n.parentId === parentId)
      const allDescendants = directChildren.map(child => child.id)
      
      directChildren.forEach(child => {
        allDescendants.push(...getDescendants(child.id))
      })
      
      return allDescendants
    }
    
    const descendantsToDelete = getDescendants(nodeId)
    const nodesToDelete = new Set([nodeId, ...descendantsToDelete])
    
    const updatedNodes = nodes.filter(n => !nodesToDelete.has(n.id))
    await this.saveTreeNodes(treeId, updatedNodes)
  }
}

export class LocalStorageStoryRepository implements StoryRepository {
  private readonly DRAFTS_KEY = 'story-drafts'
  private readonly VERSIONS_KEY = 'generated-stories'

  async createDraft(draft: Omit<StoryDraft, 'id'>): Promise<StoryDraft> {
    const newDraft: StoryDraft = {
      ...draft,
      id: `draft-${Date.now()}`
    }

    const drafts = await this.getAllDrafts()
    const updatedDrafts = [newDraft, ...drafts]
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(updatedDrafts))
    
    return newDraft
  }

  async getDraft(id: string): Promise<StoryDraft | null> {
    const drafts = await this.getAllDrafts()
    return drafts.find(draft => draft.id === id) || null
  }

  async getAllDrafts(): Promise<StoryDraft[]> {
    const draftsData = localStorage.getItem(this.DRAFTS_KEY)
    return draftsData ? JSON.parse(draftsData) : []
  }

  async updateDraft(id: string, updates: Partial<StoryDraft>): Promise<void> {
    const drafts = await this.getAllDrafts()
    const updatedDrafts = drafts.map(draft => 
      draft.id === id ? { ...draft, ...updates } : draft
    )
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(updatedDrafts))
  }

  async deleteDraft(id: string): Promise<void> {
    const drafts = await this.getAllDrafts()
    const updatedDrafts = drafts.filter(draft => draft.id !== id)
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(updatedDrafts))
    
    // Also delete associated versions
    const versions = await this.getAllVersions()
    const updatedVersions = versions.filter(version => version.draftId !== id)
    localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(updatedVersions))
  }

  async createVersion(version: Omit<StoryVersion, 'id'>): Promise<StoryVersion> {
    const newVersion: StoryVersion = {
      ...version,
      id: `version-${Date.now()}`
    }

    const versions = await this.getAllVersions()
    const updatedVersions = [newVersion, ...versions]
    localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(updatedVersions))
    
    return newVersion
  }

  async getVersion(id: string): Promise<StoryVersion | null> {
    const versions = await this.getAllVersions()
    return versions.find(version => version.id === id) || null
  }

  async getVersionsForDraft(draftId: string): Promise<StoryVersion[]> {
    const versions = await this.getAllVersions()
    return versions.filter(version => version.draftId === draftId)
  }

  async getAllVersions(): Promise<StoryVersion[]> {
    const versionsData = localStorage.getItem(this.VERSIONS_KEY)
    return versionsData ? JSON.parse(versionsData) : []
  }

  async updateVersion(id: string, updates: Partial<StoryVersion>): Promise<void> {
    const versions = await this.getAllVersions()
    const updatedVersions = versions.map(version => 
      version.id === id ? { ...version, ...updates } : version
    )
    localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(updatedVersions))
  }

  async deleteVersion(id: string): Promise<void> {
    const versions = await this.getAllVersions()
    const updatedVersions = versions.filter(version => version.id !== id)
    localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(updatedVersions))
  }
}

export class LocalStorageUserRepository implements UserRepository {
  private readonly CURRENT_TREE_KEY = 'current-tree-id'
  private readonly PREFERENCES_KEY = 'user-preferences'

  async getPreferences(): Promise<UserPreferences> {
    const preferencesData = localStorage.getItem(this.PREFERENCES_KEY)
    const preferences = preferencesData ? JSON.parse(preferencesData) : {}
    
    // Include current tree ID for backward compatibility
    const currentTreeId = await this.getCurrentTreeId()
    if (currentTreeId) {
      preferences.currentTreeId = currentTreeId
    }
    
    return preferences
  }

  async setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const existing = await this.getPreferences()
    const updated = { ...existing, ...preferences }
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated))
    
    // Handle current tree ID separately for backward compatibility
    if (preferences.currentTreeId !== undefined) {
      if (preferences.currentTreeId) {
        await this.setCurrentTreeId(preferences.currentTreeId)
      } else {
        await this.clearCurrentTreeId()
      }
    }
  }

  async getCurrentTreeId(): Promise<string | null> {
    return localStorage.getItem(this.CURRENT_TREE_KEY)
  }

  async setCurrentTreeId(treeId: string): Promise<void> {
    localStorage.setItem(this.CURRENT_TREE_KEY, treeId)
  }

  async clearCurrentTreeId(): Promise<void> {
    localStorage.removeItem(this.CURRENT_TREE_KEY)
  }
}