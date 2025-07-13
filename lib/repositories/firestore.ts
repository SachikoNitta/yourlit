// Firestore implementation of repositories

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
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  Firestore 
} from 'firebase/firestore'
import { AppSettings } from '../settings'

let firebaseApp: FirebaseApp | null = null
let firestore: Firestore | null = null

export const initializeFirebase = (settings: AppSettings): boolean => {
  try {
    if (!settings.firebaseApiKey || !settings.firebaseProjectId) {
      console.warn('Firebase configuration incomplete')
      return false
    }

    const firebaseConfig = {
      apiKey: settings.firebaseApiKey,
      projectId: settings.firebaseProjectId,
      // These are optional but can be added if needed
      authDomain: `${settings.firebaseProjectId}.firebaseapp.com`,
      storageBucket: `${settings.firebaseProjectId}.appspot.com`,
    }

    // Initialize Firebase if not already initialized
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig)
    } else {
      firebaseApp = getApps()[0]
    }

    firestore = getFirestore(firebaseApp)
    return true
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    return false
  }
}

export const isFirebaseInitialized = (): boolean => {
  return firestore !== null
}

// Test Firebase connection
export const testFirebaseConnection = async (settings: AppSettings): Promise<{ success: boolean, message: string }> => {
  try {
    if (!settings.firebaseApiKey || !settings.firebaseProjectId) {
      return {
        success: false,
        message: 'Please enter both Firebase API Key and Project ID'
      }
    }

    // Try to initialize Firebase with provided settings
    const initialized = initializeFirebase(settings)
    if (!initialized) {
      return {
        success: false,
        message: 'Failed to initialize Firebase with provided credentials'
      }
    }

    if (!firestore) {
      return {
        success: false,
        message: 'Firestore not initialized properly'
      }
    }

    // Try to perform a simple read operation to test connection
    const testRef = doc(firestore, 'connection-test', 'test')
    await getDoc(testRef)
    
    return {
      success: true,
      message: 'Successfully connected to Firebase Firestore!'
    }
  } catch (error: any) {
    console.error('Firebase connection test failed:', error)
    
    // Provide specific error messages based on error type
    if (error.code === 'permission-denied') {
      return {
        success: false,
        message: 'Permission denied. Check your Firestore security rules.'
      }
    } else if (error.code === 'unauthenticated') {
      return {
        success: false,
        message: 'Invalid API key or authentication failed.'
      }
    } else if (error.code === 'not-found') {
      return {
        success: false,
        message: 'Project not found. Check your Project ID.'
      }
    } else if (error.message?.includes('API key')) {
      return {
        success: false,
        message: 'Invalid API key format or key not found.'
      }
    } else {
      return {
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`
      }
    }
  }
}

// Firestore operations
export const saveTreeToFirestore = async (treeId: string, treeData: any): Promise<void> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const treeRef = doc(firestore, 'trees', treeId)
  await setDoc(treeRef, {
    ...treeData,
    lastModified: new Date().toISOString()
  })
}

export const loadTreeFromFirestore = async (treeId: string): Promise<any | null> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const treeRef = doc(firestore, 'trees', treeId)
  const treeSnap = await getDoc(treeRef)
  
  if (treeSnap.exists()) {
    return treeSnap.data()
  }
  return null
}

export const deleteTreeFromFirestore = async (treeId: string): Promise<void> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const treeRef = doc(firestore, 'trees', treeId)
  await deleteDoc(treeRef)
  
  // Also delete associated tree nodes
  const nodesRef = doc(firestore, 'tree-nodes', treeId)
  await deleteDoc(nodesRef)
}

export const loadAllTreesFromFirestore = async (): Promise<any[]> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const treesRef = collection(firestore, 'trees')
  const q = query(treesRef, orderBy('lastModified', 'desc'))
  const querySnapshot = await getDocs(q)
  
  const trees: any[] = []
  querySnapshot.forEach((doc) => {
    trees.push({ id: doc.id, ...doc.data() })
  })
  
  return trees
}

// Tree nodes operations
export const saveTreeNodesToFirestore = async (treeId: string, nodes: any[]): Promise<void> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const nodesRef = doc(firestore, 'tree-nodes', treeId)
  await setDoc(nodesRef, {
    nodes,
    lastModified: new Date().toISOString()
  })
}

export const loadTreeNodesFromFirestore = async (treeId: string): Promise<any[]> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const nodesRef = doc(firestore, 'tree-nodes', treeId)
  const nodesSnap = await getDoc(nodesRef)
  
  if (nodesSnap.exists()) {
    return nodesSnap.data().nodes || []
  }
  return []
}

// Story drafts operations
export const saveStoryDraftsToFirestore = async (drafts: any[]): Promise<void> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const draftsRef = doc(firestore, 'user-data', 'story-drafts')
  await setDoc(draftsRef, {
    drafts,
    lastModified: new Date().toISOString()
  })
}

export const loadStoryDraftsFromFirestore = async (): Promise<any[]> => {
  if (!firestore) throw new Error('Firestore not initialized')
  
  const draftsRef = doc(firestore, 'user-data', 'story-drafts')
  const draftsSnap = await getDoc(draftsRef)
  
  if (draftsSnap.exists()) {
    return draftsSnap.data().drafts || []
  }
  return []
}

export class FirestoreTreeRepository implements TreeRepository {
  private ensureInitialized(): void {
    if (!isFirebaseInitialized()) {
      throw new Error('Firestore not initialized')
    }
  }

  async createTree(tree: Omit<TreeData, 'id'>): Promise<TreeData> {
    this.ensureInitialized()
    
    const newTree: TreeData = {
      ...tree,
      id: `tree-${Date.now()}`,
      lastModified: new Date().toISOString()
    }

    await saveTreeToFirestore(newTree.id, newTree)
    return newTree
  }

  async getTree(id: string): Promise<TreeData | null> {
    this.ensureInitialized()
    return await loadTreeFromFirestore(id)
  }

  async getAllTrees(): Promise<TreeData[]> {
    this.ensureInitialized()
    return await loadAllTreesFromFirestore()
  }

  async updateTree(id: string, updates: Partial<TreeData>): Promise<void> {
    this.ensureInitialized()
    
    const existing = await this.getTree(id)
    if (!existing) {
      throw new Error(`Tree with id ${id} not found`)
    }

    const updated = {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    }

    await saveTreeToFirestore(id, updated)
  }

  async deleteTree(id: string): Promise<void> {
    this.ensureInitialized()
    await deleteTreeFromFirestore(id)
  }

  async saveTreeNodes(treeId: string, nodes: TreeNode[]): Promise<void> {
    this.ensureInitialized()
    
    // Deduplicate nodes
    const deduplicatedNodes = nodes.filter((node, index, array) => 
      array.findIndex(n => n.id === node.id) === index
    )
    
    await saveTreeNodesToFirestore(treeId, deduplicatedNodes)
  }

  async getTreeNodes(treeId: string): Promise<TreeNode[]> {
    this.ensureInitialized()
    return await loadTreeNodesFromFirestore(treeId)
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

export class FirestoreStoryRepository implements StoryRepository {
  private ensureInitialized(): void {
    if (!isFirebaseInitialized()) {
      throw new Error('Firestore not initialized')
    }
  }

  async createDraft(draft: Omit<StoryDraft, 'id'>): Promise<StoryDraft> {
    this.ensureInitialized()
    
    const newDraft: StoryDraft = {
      ...draft,
      id: `draft-${Date.now()}`
    }

    const drafts = await this.getAllDrafts()
    const updatedDrafts = [newDraft, ...drafts]
    await saveStoryDraftsToFirestore(updatedDrafts)
    
    return newDraft
  }

  async getDraft(id: string): Promise<StoryDraft | null> {
    const drafts = await this.getAllDrafts()
    return drafts.find(draft => draft.id === id) || null
  }

  async getAllDrafts(): Promise<StoryDraft[]> {
    this.ensureInitialized()
    return await loadStoryDraftsFromFirestore()
  }

  async updateDraft(id: string, updates: Partial<StoryDraft>): Promise<void> {
    const drafts = await this.getAllDrafts()
    const updatedDrafts = drafts.map(draft => 
      draft.id === id ? { ...draft, ...updates } : draft
    )
    await saveStoryDraftsToFirestore(updatedDrafts)
  }

  async deleteDraft(id: string): Promise<void> {
    const drafts = await this.getAllDrafts()
    const updatedDrafts = drafts.filter(draft => draft.id !== id)
    await saveStoryDraftsToFirestore(updatedDrafts)
    
    // Also delete associated versions
    const versions = await this.getAllVersions()
    const updatedVersions = versions.filter(version => version.draftId !== id)
    // Note: In a real implementation, you'd want a separate Firestore collection for versions
    // For now, we'll store versions within the drafts document or create a separate method
  }

  async createVersion(version: Omit<StoryVersion, 'id'>): Promise<StoryVersion> {
    this.ensureInitialized()
    
    const newVersion: StoryVersion = {
      ...version,
      id: `version-${Date.now()}`
    }

    const versions = await this.getAllVersions()
    const updatedVersions = [newVersion, ...versions]
    
    // Store versions in a separate document/collection
    // This is a simplified implementation - in production you'd want proper versioning
    await this.saveAllVersions(updatedVersions)
    
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
    this.ensureInitialized()
    // This is a simplified implementation
    // In production, you'd want a separate Firestore collection for versions
    try {
      // For now, we'll return empty array and implement this when needed
      return []
    } catch (error) {
      console.warn('Versions not yet implemented in Firestore repository')
      return []
    }
  }

  async updateVersion(id: string, updates: Partial<StoryVersion>): Promise<void> {
    const versions = await this.getAllVersions()
    const updatedVersions = versions.map(version => 
      version.id === id ? { ...version, ...updates } : version
    )
    await this.saveAllVersions(updatedVersions)
  }

  async deleteVersion(id: string): Promise<void> {
    const versions = await this.getAllVersions()
    const updatedVersions = versions.filter(version => version.id !== id)
    await this.saveAllVersions(updatedVersions)
  }

  private async saveAllVersions(versions: StoryVersion[]): Promise<void> {
    // Simplified implementation - in production you'd want proper Firestore collections
    // For now, we'll store in user-data collection
    try {
      // Implementation would go here for a separate versions collection
      console.warn('Version saving not yet fully implemented in Firestore')
    } catch (error) {
      console.error('Error saving versions to Firestore:', error)
    }
  }
}

export class FirestoreUserRepository implements UserRepository {
  private ensureInitialized(): void {
    if (!isFirebaseInitialized()) {
      throw new Error('Firestore not initialized')
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    // For user preferences, we still use localStorage as it's session-specific
    // and doesn't need to sync across devices
    const preferencesData = localStorage.getItem('user-preferences')
    const preferences = preferencesData ? JSON.parse(preferencesData) : {}
    
    // Include current tree ID
    const currentTreeId = await this.getCurrentTreeId()
    if (currentTreeId) {
      preferences.currentTreeId = currentTreeId
    }
    
    return preferences
  }

  async setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    // Store preferences locally as they're session/device specific
    const existing = await this.getPreferences()
    const updated = { ...existing, ...preferences }
    localStorage.setItem('user-preferences', JSON.stringify(updated))
    
    // Handle current tree ID
    if (preferences.currentTreeId !== undefined) {
      if (preferences.currentTreeId) {
        await this.setCurrentTreeId(preferences.currentTreeId)
      } else {
        await this.clearCurrentTreeId()
      }
    }
  }

  async getCurrentTreeId(): Promise<string | null> {
    // Current tree ID is session-specific, so we keep it in localStorage
    return localStorage.getItem('current-tree-id')
  }

  async setCurrentTreeId(treeId: string): Promise<void> {
    localStorage.setItem('current-tree-id', treeId)
  }

  async clearCurrentTreeId(): Promise<void> {
    localStorage.removeItem('current-tree-id')
  }
}