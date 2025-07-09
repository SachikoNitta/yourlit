import { TreeNode } from './types'

/**
 * Cleans up outdated properties from TreeNode objects
 * Removes properties that are no longer part of the TreeNode interface
 */
export function cleanupTreeNode(node: any): TreeNode {
  const cleanNode: TreeNode = {
    id: node.id,
  }

  // Only include valid TreeNode properties
  if (node.question !== undefined) cleanNode.question = node.question
  if (node.answer !== undefined) cleanNode.answer = node.answer
  if (node.parentId !== undefined) cleanNode.parentId = node.parentId
  if (node.isGenerating !== undefined) cleanNode.isGenerating = node.isGenerating
  if (node.showQuestionInput !== undefined) cleanNode.showQuestionInput = node.showQuestionInput
  if (node.showEditInput !== undefined) cleanNode.showEditInput = node.showEditInput

  return cleanNode
}

/**
 * Cleans up an array of TreeNode objects
 */
export function cleanupTreeNodes(nodes: any[]): TreeNode[] {
  return nodes.map(cleanupTreeNode)
}

/**
 * Cleans up all tree data in localStorage
 * Removes outdated properties from all stored tree data
 */
export function cleanupAllTreeData(): void {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage)
    
    // Find all tree data keys (tree-${id})
    const treeKeys = keys.filter(key => key.startsWith('tree-'))
    
    console.log(`Found ${treeKeys.length} tree data entries to clean up`)
    
    treeKeys.forEach(key => {
      try {
        const rawData = localStorage.getItem(key)
        if (!rawData) return
        
        const nodes = JSON.parse(rawData)
        if (!Array.isArray(nodes)) return
        
        // Clean up the nodes
        const cleanedNodes = cleanupTreeNodes(nodes)
        
        // Save back to localStorage
        localStorage.setItem(key, JSON.stringify(cleanedNodes))
        
        console.log(`Cleaned up ${key}: removed outdated properties from ${nodes.length} nodes`)
      } catch (error) {
        console.error(`Error cleaning up ${key}:`, error)
      }
    })
    
    console.log('Tree data cleanup completed')
  } catch (error) {
    console.error('Error during tree data cleanup:', error)
  }
}

/**
 * Cleans up outdated draft data
 * Ensures all drafts have the correct structure
 */
export function cleanupDraftData(): void {
  try {
    // Clean up story-drafts
    const storyDrafts = localStorage.getItem('story-drafts')
    if (storyDrafts) {
      const drafts = JSON.parse(storyDrafts)
      if (Array.isArray(drafts)) {
        const cleanedDrafts = drafts.map(draft => ({
          id: draft.id,
          title: draft.title || 'Untitled',
          content: draft.content || '',
          createdAt: draft.createdAt || new Date().toISOString(),
          nodeId: draft.nodeId
        })).filter(draft => draft.id && draft.content) // Remove invalid drafts
        
        localStorage.setItem('story-drafts', JSON.stringify(cleanedDrafts))
        console.log(`Cleaned up story-drafts: ${cleanedDrafts.length} valid drafts remaining`)
      }
    }
    
    // Clean up generated-stories
    const generatedStories = localStorage.getItem('generated-stories')
    if (generatedStories) {
      const stories = JSON.parse(generatedStories)
      if (Array.isArray(stories)) {
        const cleanedStories = stories.map(story => ({
          id: story.id,
          title: story.title || 'Untitled',
          content: story.content || '',
          prompt: story.prompt || '',
          originalDraftId: story.originalDraftId,
          createdAt: story.createdAt || new Date().toISOString()
        })).filter(story => story.id && story.content) // Remove invalid stories
        
        localStorage.setItem('generated-stories', JSON.stringify(cleanedStories))
        console.log(`Cleaned up generated-stories: ${cleanedStories.length} valid stories remaining`)
      }
    }
    
    // Clean up alternative drafts (from NodeGroup)
    const drafts = localStorage.getItem('drafts')
    if (drafts) {
      const draftArray = JSON.parse(drafts)
      if (Array.isArray(draftArray)) {
        const cleanedDrafts = draftArray.map(draft => ({
          id: draft.id,
          title: draft.title || 'Untitled',
          content: draft.content || '',
          timestamp: draft.timestamp || new Date().toISOString()
        })).filter(draft => draft.id && draft.content) // Remove invalid drafts
        
        localStorage.setItem('drafts', JSON.stringify(cleanedDrafts))
        console.log(`Cleaned up drafts: ${cleanedDrafts.length} valid drafts remaining`)
      }
    }
    
    console.log('Draft data cleanup completed')
  } catch (error) {
    console.error('Error during draft data cleanup:', error)
  }
}

/**
 * Cleans up story tree metadata
 * Ensures all trees have valid structure and removes orphaned entries
 */
export function cleanupTreeMetadata(): void {
  try {
    const storyTrees = localStorage.getItem('story-trees')
    if (!storyTrees) return
    
    const trees = JSON.parse(storyTrees)
    if (!Array.isArray(trees)) return
    
    // Get all available tree data keys
    const keys = Object.keys(localStorage)
    const availableTreeIds = keys
      .filter(key => key.startsWith('tree-'))
      .map(key => key.replace('tree-', ''))
    
    // Filter trees to only include those with actual data
    const validTrees = trees.filter(tree => {
      const hasData = availableTreeIds.includes(tree.id)
      if (!hasData) {
        console.log(`Removing orphaned tree metadata: ${tree.id}`)
      }
      return hasData
    }).map(tree => ({
      id: tree.id,
      title: tree.title || 'Untitled Tree',
      createdAt: tree.createdAt || new Date().toISOString(),
      lastModified: tree.lastModified || tree.createdAt || new Date().toISOString()
    }))
    
    localStorage.setItem('story-trees', JSON.stringify(validTrees))
    console.log(`Cleaned up story-trees: ${validTrees.length} valid trees remaining`)
  } catch (error) {
    console.error('Error during tree metadata cleanup:', error)
  }
}

/**
 * Removes completely empty or invalid tree data
 */
export function removeInvalidTreeData(): void {
  try {
    const keys = Object.keys(localStorage)
    const treeKeys = keys.filter(key => key.startsWith('tree-'))
    
    treeKeys.forEach(key => {
      try {
        const rawData = localStorage.getItem(key)
        if (!rawData) {
          localStorage.removeItem(key)
          console.log(`Removed empty tree data: ${key}`)
          return
        }
        
        const nodes = JSON.parse(rawData)
        if (!Array.isArray(nodes) || nodes.length === 0) {
          localStorage.removeItem(key)
          console.log(`Removed invalid/empty tree data: ${key}`)
          return
        }
        
        // Check if tree has at least one valid node
        const hasValidNodes = nodes.some(node => 
          node.id && (node.question || node.answer)
        )
        
        if (!hasValidNodes) {
          localStorage.removeItem(key)
          console.log(`Removed tree with no valid nodes: ${key}`)
        }
      } catch (error) {
        console.error(`Error validating ${key}, removing:`, error)
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error during invalid data removal:', error)
  }
}

/**
 * Comprehensive cleanup of all localStorage data
 * Runs all cleanup functions in the correct order
 */
export function performFullCleanup(): void {
  console.log('Starting comprehensive localStorage cleanup...')
  
  try {
    // 1. Clean up tree node data (remove outdated properties)
    cleanupAllTreeData()
    
    // 2. Remove invalid tree data
    removeInvalidTreeData()
    
    // 3. Clean up tree metadata (remove orphaned entries)
    cleanupTreeMetadata()
    
    // 4. Clean up draft data
    cleanupDraftData()
    
    console.log('✅ Comprehensive localStorage cleanup completed successfully!')
    
    // Log final storage usage
    const totalItems = Object.keys(localStorage).length
    console.log(`📊 Total localStorage items: ${totalItems}`)
    
  } catch (error) {
    console.error('❌ Error during comprehensive cleanup:', error)
  }
}

/**
 * Gets a summary of current localStorage usage
 */
export function getStorageSummary(): {
  totalItems: number
  treeDataCount: number
  draftCount: number
  storyCount: number
  treeMetadataCount: number
} {
  const keys = Object.keys(localStorage)
  
  return {
    totalItems: keys.length,
    treeDataCount: keys.filter(key => key.startsWith('tree-')).length,
    draftCount: (() => {
      try {
        const drafts = localStorage.getItem('story-drafts')
        return drafts ? JSON.parse(drafts).length : 0
      } catch {
        return 0
      }
    })(),
    storyCount: (() => {
      try {
        const stories = localStorage.getItem('generated-stories')
        return stories ? JSON.parse(stories).length : 0
      } catch {
        return 0
      }
    })(),
    treeMetadataCount: (() => {
      try {
        const trees = localStorage.getItem('story-trees')
        return trees ? JSON.parse(trees).length : 0
      } catch {
        return 0
      }
    })()
  }
}