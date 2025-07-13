// Tree service using repository layer

import { TreeRepository, TreeData, TreeNode } from '../repositories/types'

export class TreeService {
  constructor(private treeRepository: TreeRepository) {}

  // Tree management
  async createTree(title: string, initialQuestion?: string): Promise<TreeData> {
    const tree = await this.treeRepository.createTree({
      title,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    })

    // Create root node if initial question provided
    if (initialQuestion) {
      const rootNode: TreeNode = {
        id: 'root',
        question: initialQuestion
      }
      await this.treeRepository.saveTreeNodes(tree.id, [rootNode])
    }

    return tree
  }

  async getTree(id: string): Promise<TreeData | null> {
    return await this.treeRepository.getTree(id)
  }

  async getAllTrees(): Promise<TreeData[]> {
    const trees = await this.treeRepository.getAllTrees()
    // Sort by last modified, most recent first
    return trees.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )
  }

  async updateTree(id: string, updates: Partial<TreeData>): Promise<void> {
    await this.treeRepository.updateTree(id, updates)
  }

  async deleteTree(id: string): Promise<void> {
    await this.treeRepository.deleteTree(id)
  }

  // Tree nodes management
  async getTreeNodes(treeId: string): Promise<TreeNode[]> {
    return await this.treeRepository.getTreeNodes(treeId)
  }

  async addNode(treeId: string, node: TreeNode): Promise<void> {
    await this.treeRepository.addNode(treeId, node)
    // Update tree's last modified timestamp
    await this.updateTree(treeId, { lastModified: new Date().toISOString() })
  }

  async addMultipleNodes(treeId: string, nodes: TreeNode[]): Promise<void> {
    const existingNodes = await this.treeRepository.getTreeNodes(treeId)
    const allNodes = [...existingNodes, ...nodes]
    await this.treeRepository.saveTreeNodes(treeId, allNodes)
    // Update tree's last modified timestamp
    await this.updateTree(treeId, { lastModified: new Date().toISOString() })
  }

  async updateNode(treeId: string, nodeId: string, updates: Partial<TreeNode>): Promise<void> {
    await this.treeRepository.updateNode(treeId, nodeId, updates)
    // Update tree's last modified timestamp
    await this.updateTree(treeId, { lastModified: new Date().toISOString() })
  }

  async deleteNode(treeId: string, nodeId: string): Promise<void> {
    await this.treeRepository.deleteNode(treeId, nodeId)
    // Update tree's last modified timestamp
    await this.updateTree(treeId, { lastModified: new Date().toISOString() })
  }

  // Utility methods
  async getRootNode(treeId: string): Promise<TreeNode | null> {
    const nodes = await this.getTreeNodes(treeId)
    return nodes.find(node => node.id === 'root') || null
  }

  async getChildNodes(treeId: string, parentId: string): Promise<TreeNode[]> {
    const nodes = await this.getTreeNodes(treeId)
    return nodes.filter(node => node.parentId === parentId)
  }

  async getNodePath(treeId: string, nodeId: string): Promise<TreeNode[]> {
    const nodes = await this.getTreeNodes(treeId)
    const nodeMap = new Map(nodes.map(node => [node.id, node]))
    
    const path: TreeNode[] = []
    let currentId: string | undefined = nodeId
    const visited = new Set<string>()

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      const node = nodeMap.get(currentId)
      if (!node) break
      
      path.unshift(node)
      currentId = node.parentId
    }

    return path
  }

  async buildContext(treeId: string, nodeId: string): Promise<string> {
    const path = await this.getNodePath(treeId, nodeId)
    const context: string[] = []

    for (const node of path) {
      if (node.question) {
        context.push(`Q: ${node.question}`)
      }
      if (node.answer) {
        context.push(`A: ${node.answer}`)
      }
    }

    return context.join('\n')
  }

  async buildStoryThread(treeId: string, nodeId: string): Promise<string> {
    const path = await this.getNodePath(treeId, nodeId)
    const thread: string[] = []

    for (const node of path) {
      if (node.answer) {
        thread.push(node.answer)
      }
    }

    return thread.join('\n\n')
  }

  // Data integrity methods
  async deduplicateNodes(treeId: string): Promise<number> {
    const nodes = await this.getTreeNodes(treeId)
    const uniqueNodes = nodes.filter((node, index, array) => 
      array.findIndex(n => n.id === node.id) === index
    )
    
    const duplicatesRemoved = nodes.length - uniqueNodes.length
    
    if (duplicatesRemoved > 0) {
      await this.treeRepository.saveTreeNodes(treeId, uniqueNodes)
    }
    
    return duplicatesRemoved
  }

  async validateTreeStructure(treeId: string): Promise<{
    isValid: boolean
    issues: string[]
  }> {
    const nodes = await this.getTreeNodes(treeId)
    const issues: string[] = []
    
    // Check for root node
    const rootNode = nodes.find(node => node.id === 'root')
    if (!rootNode) {
      issues.push('Missing root node')
    }
    
    // Check for orphaned nodes (except root)
    const nodeIds = new Set(nodes.map(node => node.id))
    for (const node of nodes) {
      if (node.id !== 'root' && node.parentId && !nodeIds.has(node.parentId)) {
        issues.push(`Orphaned node: ${node.id} (parent ${node.parentId} not found)`)
      }
    }
    
    // Check for circular references
    const visited = new Set<string>()
    for (const node of nodes) {
      if (this.hasCircularReference(node, nodes, visited)) {
        issues.push(`Circular reference detected involving node: ${node.id}`)
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }

  private hasCircularReference(
    startNode: TreeNode, 
    allNodes: TreeNode[], 
    globalVisited: Set<string>
  ): boolean {
    if (globalVisited.has(startNode.id)) return false
    
    const localVisited = new Set<string>()
    const nodeMap = new Map(allNodes.map(node => [node.id, node]))
    
    let currentId: string | undefined = startNode.id
    
    while (currentId) {
      if (localVisited.has(currentId)) return true
      localVisited.add(currentId)
      globalVisited.add(currentId)
      
      const node = nodeMap.get(currentId)
      currentId = node?.parentId
    }
    
    return false
  }
}