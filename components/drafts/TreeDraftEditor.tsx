import { useState, useEffect } from "react"
import { TreeNodeComponent } from '@/app/trees/default-editor/TreeNodeComponent'
import { SimpleTreeNodeComponent } from '@/app/trees/simple-editor/SimpleTreeNodeComponent'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TreeNode } from '@/app/trees/types'
import { generateAnswers } from '@/actions'
import { AppSettings, getApiKey } from '@/lib/settings'
import { Draft } from "../../lib/draftsStorage"
import { convertTextToTree } from '@/lib/textToTree'
import { Save, X, TreePine, FileText } from "lucide-react"

interface TreeDraftEditorProps {
  draft: Draft
  onSave: (draftId: string, updates: { title?: string; content?: string }) => void
  onCancel: () => void
  settings: AppSettings
}

export function TreeDraftEditor({ 
  draft, 
  onSave, 
  onCancel, 
  settings 
}: TreeDraftEditorProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [editTitle, setEditTitle] = useState(draft.title)
  const [editorMode, setEditorMode] = useState<'advanced' | 'simple'>('advanced')
  const [viewMode, setViewMode] = useState<'tree' | 'text'>('tree')
  const [textContent, setTextContent] = useState('')

  useEffect(() => {
    // Convert draft content to tree structure
    if (draft.content) {
      const treeNodes = convertTextToTree(draft.content, { title: draft.title })
      setNodes(treeNodes)
    } else {
      // Create initial root node if no content
      const rootNode: TreeNode = {
        id: 'root',
        question: draft.title || 'Untitled Story',
        answer: draft.content || ''
      }
      setNodes([rootNode])
    }
  }, [draft])

  useEffect(() => {
    // Update text content when nodes change
    const content = generateTextFromTree(nodes)
    setTextContent(content)
  }, [nodes])

  const generateTextFromTree = (treeNodes: TreeNode[]): string => {
    if (treeNodes.length === 0) return ''
    
    const rootNode = treeNodes.find(n => n.id === 'root')
    if (!rootNode) return ''
    
    let content = ''
    
    if (rootNode.question) {
      content += `${rootNode.question}\n\n`
    }
    
    if (rootNode.answer) {
      content += `${rootNode.answer}\n\n`
    }
    
    // Add child nodes in a hierarchical format
    const addChildNodes = (parentId: string, level: number = 0) => {
      const children = treeNodes.filter(n => n.parentId === parentId)
      children.forEach(child => {
        const indent = '  '.repeat(level)
        if (child.question) {
          content += `${indent}Q: ${child.question}\n`
        }
        if (child.answer) {
          content += `${indent}A: ${child.answer}\n`
        }
        content += '\n'
        addChildNodes(child.id, level + 1)
      })
    }
    
    addChildNodes('root')
    
    return content.trim()
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
      // Deduplicate by ID
      const deduplicatedNodes = allNodes.filter((node, index, array) => 
        array.findIndex(n => n.id === node.id) === index
      )
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

  const handleSave = () => {
    const finalContent = viewMode === 'tree' ? textContent : textContent
    onSave(draft.id, {
      title: editTitle,
      content: finalContent
    })
  }

  const rootNode = nodes.find(n => n.id === 'root')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="text-xl font-bold"
            placeholder="Story title"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save size={16} />
            Save
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X size={16} />
            Cancel
          </Button>
        </div>
      </div>

      {/* Mode Controls */}
      <div className="flex gap-4">
        <div className="flex gap-1 bg-muted p-1 rounded-md">
          <Button
            size="sm"
            variant={viewMode === 'tree' ? "default" : "ghost"}
            onClick={() => setViewMode('tree')}
            className="h-7 flex items-center gap-1"
          >
            <TreePine size={14} />
            Tree Editor
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'text' ? "default" : "ghost"}
            onClick={() => setViewMode('text')}
            className="h-7 flex items-center gap-1"
          >
            <FileText size={14} />
            Text View
          </Button>
        </div>
        
        {viewMode === 'tree' && (
          <div className="flex gap-1 bg-muted p-1 rounded-md">
            <Button
              size="sm"
              variant={editorMode === 'advanced' ? "default" : "ghost"}
              onClick={() => setEditorMode('advanced')}
              className="h-7"
            >
              Advanced
            </Button>
            <Button
              size="sm"
              variant={editorMode === 'simple' ? "default" : "ghost"}
              onClick={() => setEditorMode('simple')}
              className="h-7"
            >
              Simple
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {viewMode === 'tree' ? (
          <div className="border rounded-lg p-4">
            {rootNode ? (
              editorMode === 'advanced' ? (
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
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <TreePine size={48} className="mx-auto mb-4" />
                <p>No content to display in tree format</p>
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="bg-gray-50 rounded-lg p-4 min-h-[350px]">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {textContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}