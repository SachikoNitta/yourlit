"use client"

import { useState, useEffect } from "react"
import { TreeNodeComponent } from '@/app/trees/default-editor/TreeNodeComponent'
import { SimpleTreeNodeComponent } from '@/app/trees/simple-editor/SimpleTreeNodeComponent'
import { ActivityBar } from '@/components/ActivityBar'
import { SettingsPage } from '@/components/SettingsPage'
import { StoriesPage } from '@/components/StoriesPage'
import { TreesPage } from '@/components/TreesPage'
import { TreeNode } from '@/app/trees/types'
import { 
  performFullCleanup, 
  getStorageSummary, 
  cleanupAllTreeData 
} from '@/app/trees/dataCleanup'
import { generateAnswers } from '@/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { AppSettings, loadSettings, saveSettings, getApiKey } from '@/lib/settings'
import { convertTextToTree } from '@/lib/textToTree'

function InitialQuestionForm({ onSubmit }: { onSubmit: (question: string) => void }) {
  const [question, setQuestion] = useState("")

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question.trim())
      setQuestion("")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Start Your AI Story Tree</h2>
        <p className="text-gray-600 mb-8">Ask a question or start a conversation to begin exploring different paths.</p>
        
        <div className="max-w-md mx-auto space-y-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question or start a story..."
            className="text-center"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!question.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Start Story Tree
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Component() {
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    openaiKey: '',
    geminiKey: '',
    aiProvider: 'openai',
    responseLanguage: 'en',
    defaultNumAnswers: 3,
    defaultResponseLength: 'medium'
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentPage, setCurrentPage] = useState<'trees' | 'tree' | 'settings' | 'stories'>('trees')
  const [trees, setTrees] = useState<any[]>([])
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<'advanced' | 'simple'>('advanced')

  useEffect(() => {
    // Run cleanup on first load (only once per session)
    const hasRunCleanup = sessionStorage.getItem('cleanup-run')
    if (!hasRunCleanup) {
      console.log('Running automatic localStorage cleanup...')
      cleanupAllTreeData()
      sessionStorage.setItem('cleanup-run', 'true')
    }
    
    // Load trees from localStorage
    const savedTrees = localStorage.getItem('story-trees')
    if (savedTrees) {
      const parsedTrees = JSON.parse(savedTrees)
      setTrees(parsedTrees)
    }
    
    // Load current tree ID
    const currentId = localStorage.getItem('current-tree-id')
    if (currentId) {
      setCurrentTreeId(currentId)
      // Load nodes for current tree
      const treeNodes = localStorage.getItem(`tree-${currentId}`)
      if (treeNodes) {
        const parsedNodes = JSON.parse(treeNodes)
        // Deduplicate nodes when loading from localStorage
        const deduplicatedNodes = parsedNodes.filter((node: TreeNode, index: number, array: TreeNode[]) => 
          array.findIndex(n => n.id === node.id) === index
        )
        
        if (parsedNodes.length !== deduplicatedNodes.length) {
          console.log('🚨 DUPLICATE NODES FOUND IN LOCALSTORAGE:', {
            originalCount: parsedNodes.length,
            deduplicatedCount: deduplicatedNodes.length
          })
          // Save the cleaned data back to localStorage
          localStorage.setItem(`tree-${currentId}`, JSON.stringify(deduplicatedNodes))
        }
        
        setNodes(deduplicatedNodes.length > 0 ? deduplicatedNodes : [])
      }
    }
    
    // Load settings
    setSettings(loadSettings())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && currentTreeId) {
      localStorage.setItem(`tree-${currentTreeId}`, JSON.stringify(nodes))
    }
  }, [nodes, isHydrated, currentTreeId])

  useEffect(() => {
    if (isHydrated) {
      saveSettings(settings)
    }
  }, [settings, isHydrated])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const updateNode = (nodeId: string, updates: Partial<TreeNode>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    )
  }

  const addNodes = (newNodes: TreeNode[]) => {
    setNodes(prevNodes => {
      const allNodes = [...prevNodes, ...newNodes]
      // Deduplicate by ID (keep the first occurrence)
      const deduplicatedNodes = allNodes.filter((node, index, array) => 
        array.findIndex(n => n.id === node.id) === index
      )
      
      if (allNodes.length !== deduplicatedNodes.length) {
        console.log('🚨 DUPLICATE NODES REMOVED:', {
          originalCount: allNodes.length,
          deduplicatedCount: deduplicatedNodes.length,
          removedCount: allNodes.length - deduplicatedNodes.length
        })
      }
      
      return deduplicatedNodes
    })
  }

  const deleteNode = (nodeId: string) => {
    setNodes(prevNodes => {
      const getDescendants = (parentId: string): string[] => {
        const directChildren = prevNodes.filter(n => n.parentId === parentId)
        const allDescendants = directChildren.map(child => child.id)
        
        directChildren.forEach(child => {
          allDescendants.push(...getDescendants(child.id))
        })
        
        return allDescendants
      }
      
      const descendantsToDelete = getDescendants(nodeId)
      const nodesToDelete = new Set([nodeId, ...descendantsToDelete])
      
      return prevNodes.filter(n => !nodesToDelete.has(n.id))
    })
  }

  const clearQuestion = (nodeId: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, question: undefined, showQuestionInput: false }
          : node
      )
    )
  }


  // Manual cleanup function
  const runDataCleanup = () => {
    const beforeSummary = getStorageSummary()
    console.log('Before cleanup:', beforeSummary)
    
    performFullCleanup()
    
    // Also deduplicate current nodes in memory
    setNodes(prevNodes => {
      const deduplicatedNodes = prevNodes.filter((node, index, array) => 
        array.findIndex(n => n.id === node.id) === index
      )
      
      if (prevNodes.length !== deduplicatedNodes.length) {
        console.log('🚨 DUPLICATE NODES REMOVED FROM MEMORY:', {
          originalCount: prevNodes.length,
          deduplicatedCount: deduplicatedNodes.length
        })
      }
      
      return deduplicatedNodes
    })
    
    const afterSummary = getStorageSummary()
    console.log('After cleanup:', afterSummary)
    
    // Reload current tree data if available
    if (currentTreeId) {
      const savedNodes = localStorage.getItem(`tree-${currentTreeId}`)
      if (savedNodes) {
        const parsedNodes = JSON.parse(savedNodes)
        const deduplicatedNodes = parsedNodes.filter((node: TreeNode, index: number, array: TreeNode[]) => 
          array.findIndex(n => n.id === node.id) === index
        )
        setNodes(deduplicatedNodes)
      }
    }
  }

  const rootNode = nodes.find(n => n.id === 'root')

  const createNewTree = async (question: string) => {
    const treeId = `tree-${Date.now()}`
    const newTree = {
      id: treeId,
      title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    const updatedTrees = [newTree, ...trees]
    setTrees(updatedTrees)
    localStorage.setItem('story-trees', JSON.stringify(updatedTrees))
    
    setCurrentTreeId(treeId)
    localStorage.setItem('current-tree-id', treeId)
    
    const rootNode: TreeNode = {
      id: 'root',
      question: question,
      isGenerating: true
    }
    
    setNodes([rootNode])
    setCurrentPage('tree')
    
    try {
      const apiKey = getApiKey(settings)
      const answers = await generateAnswers(question, apiKey, settings.responseLanguage, settings.aiProvider, 3, undefined, 'medium')
      
      const newNodes = answers.slice(0, 3).map((answer, index) => ({
        id: `root-${Date.now()}-${index}`,
        answer: answer.trim(),
        parentId: 'root',
      }))

      setNodes([{ ...rootNode, isGenerating: false }, ...newNodes])
    } catch (error) {
      console.error("Error generating initial answers:", error)
      setNodes([{ ...rootNode, isGenerating: false }])
    }
  }

  const createNewTreeFromText = async (title: string, text: string) => {
    const treeId = `tree-${Date.now()}`
    const newTree = {
      id: treeId,
      title: title,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    const updatedTrees = [newTree, ...trees]
    setTrees(updatedTrees)
    localStorage.setItem('story-trees', JSON.stringify(updatedTrees))
    
    setCurrentTreeId(treeId)
    localStorage.setItem('current-tree-id', treeId)
    
    // Convert text to tree nodes
    const treeNodes = convertTextToTree(text, { title })
    setNodes(treeNodes)
    setCurrentPage('tree')
  }

  const selectTree = (treeId: string) => {
    setCurrentTreeId(treeId)
    localStorage.setItem('current-tree-id', treeId)
    
    const treeNodes = localStorage.getItem(`tree-${treeId}`)
    if (treeNodes) {
      const parsedNodes = JSON.parse(treeNodes)
      setNodes(parsedNodes)
    } else {
      setNodes([])
    }
    
    setCurrentPage('tree')
  }

  const deleteTree = (treeId: string) => {
    const updatedTrees = trees.filter(tree => tree.id !== treeId)
    setTrees(updatedTrees)
    localStorage.setItem('story-trees', JSON.stringify(updatedTrees))
    localStorage.removeItem(`tree-${treeId}`)
    
    if (currentTreeId === treeId) {
      setCurrentTreeId(null)
      setNodes([])
      localStorage.removeItem('current-tree-id')
    }
  }

  const createRootNode = async (question: string) => {
    await createNewTree(question)
  }

  return (
    <>
      <ActivityBar
        onShowTrees={() => setCurrentPage('trees')}
        onShowSettings={() => setCurrentPage('settings')}
        onShowStories={() => setCurrentPage('stories')}
      />
      
      {currentPage === 'trees' && (
        <TreesPage
          trees={trees}
          openaiKey={settings.openaiKey}
          geminiKey={settings.geminiKey}
          aiProvider={settings.aiProvider}
          isHydrated={isHydrated}
          onCreateTree={createNewTree}
          onCreateTreeFromText={createNewTreeFromText}
          onSelectTree={selectTree}
          onDeleteTree={deleteTree}
          onGoToSettings={() => setCurrentPage('settings')}
        />
      )}
      
      {currentPage === 'tree' && (
        <div className="ml-12 w-[calc(100vw-3rem)] p-6">
          {!rootNode ? (
            <InitialQuestionForm onSubmit={createRootNode} />
          ) : (
            <div className="w-full">
              {/* Controls */}
              <div className="mb-6 flex gap-2 justify-between items-center">
                <div className="flex gap-1 bg-muted p-1 rounded-md">
                  <Button
                    size="sm"
                    variant={editorMode === 'advanced' ? "default" : "ghost"}
                    onClick={() => setEditorMode('advanced')}
                    className="h-7"
                  >
                    Advanced Editor
                  </Button>
                  <Button
                    size="sm"
                    variant={editorMode === 'simple' ? "default" : "ghost"}
                    onClick={() => setEditorMode('simple')}
                    className="h-7"
                  >
                    Simple Editor
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log('Current tree structure:', {
                        rootNode: rootNode,
                        allNodes: nodes,
                        nodesByParent: nodes.reduce((acc, node) => {
                          const parentId = node.parentId || 'root'
                          if (!acc[parentId]) acc[parentId] = []
                          acc[parentId].push(node.id)
                          return acc
                        }, {} as Record<string, string[]>)
                      })
                    }}
                    className="h-7 text-xs text-muted-foreground"
                    title="Debug tree structure"
                  >
                    Debug
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={runDataCleanup}
                    className="h-7 text-xs text-muted-foreground"
                    title="Clean up localStorage data"
                  >
                    Cleanup
                  </Button>
                </div>
              </div>

              {editorMode === 'advanced' ? (
                <TreeNodeComponent 
                  node={rootNode} 
                  level={0} 
                  allNodes={nodes}
                  openaiKey={settings.openaiKey}
                  geminiKey={settings.geminiKey}
                  aiProvider={settings.aiProvider}
                  responseLanguage={settings.responseLanguage}
                  defaultNumAnswers={settings.defaultNumAnswers}
                  defaultResponseLength={settings.defaultResponseLength}
                  onUpdateNode={updateNode} 
                  onAddNodes={addNodes} 
                  onDeleteNode={deleteNode}
                  onClearQuestion={clearQuestion}
                />
              ) : (
                <SimpleTreeNodeComponent 
                  node={rootNode} 
                  level={0} 
                  allNodes={nodes}
                  openaiKey={settings.openaiKey}
                  geminiKey={settings.geminiKey}
                  aiProvider={settings.aiProvider}
                  responseLanguage={settings.responseLanguage}
                  defaultNumAnswers={settings.defaultNumAnswers}
                  defaultResponseLength={settings.defaultResponseLength}
                  onUpdateNode={updateNode} 
                  onAddNodes={addNodes} 
                  onDeleteNode={deleteNode}
                  onClearQuestion={clearQuestion}
                />
              )}
            </div>
          )}
        </div>
      )}
      
      {currentPage === 'settings' && (
        <SettingsPage
          openaiKey={settings.openaiKey}
          geminiKey={settings.geminiKey}
          aiProvider={settings.aiProvider}
          responseLanguage={settings.responseLanguage}
          defaultNumAnswers={settings.defaultNumAnswers}
          defaultResponseLength={settings.defaultResponseLength}
          isHydrated={isHydrated}
          onOpenaiKeyChange={(key) => updateSettings({ openaiKey: key })}
          onGeminiKeyChange={(key) => updateSettings({ geminiKey: key })}
          onAiProviderChange={(provider) => updateSettings({ aiProvider: provider })}
          onResponseLanguageChange={(language) => updateSettings({ responseLanguage: language })}
          onDefaultNumAnswersChange={(count) => updateSettings({ defaultNumAnswers: count })}
          onDefaultResponseLengthChange={(length) => updateSettings({ defaultResponseLength: length })}
        />
      )}
      
      {currentPage === 'stories' && (
        <StoriesPage
          openaiKey={settings.openaiKey}
          geminiKey={settings.geminiKey}
          aiProvider={settings.aiProvider}
          responseLanguage={settings.responseLanguage}
          isHydrated={isHydrated}
        />
      )}
      
    </>
  )
}