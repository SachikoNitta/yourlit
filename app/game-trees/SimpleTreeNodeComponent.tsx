"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Heart, HeartCrack, Loader2, X, FileText, Save, Edit2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateAnswers } from "../../actions"
import { NodeProps, TreeNode } from './types'

export function SimpleTreeNodeComponent({ 
  node, 
  level, 
  allNodes, 
  openaiKey, 
  geminiKey, 
  aiProvider, 
  responseLanguage,
  defaultNumAnswers,
  defaultResponseLength,
  onUpdateNode, 
  onAddNodes, 
  onDeleteNode,
  onClearQuestion
}: NodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const [showConversationThread, setShowConversationThread] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [editInput, setEditInput] = useState("")
  
  const rawChildren = allNodes.filter(n => 
    n.parentId === node.id && 
    n.id !== node.id && // Prevent self-reference
    n.id !== 'root' // Prevent root node from appearing as child
  )
  
  // Deduplicate children by ID (keep the first occurrence)
  const children = rawChildren.filter((child, index, array) => 
    array.findIndex(c => c.id === child.id) === index
  )
  
  const hasChildren = children.length > 0

  const buildContext = (currentNode: TreeNode): string => {
    const context: string[] = []
    const visited = new Set<string>()
    
    // Build the conversation path from root to current node
    const buildPath = (nodeId: string): void => {
      // Prevent infinite recursion
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      const n = allNodes.find(n => n.id === nodeId)
      if (!n) return
      
      // Add parent first (recursive)
      if (n.parentId && !visited.has(n.parentId)) {
        buildPath(n.parentId)
      }
      
      // Add current node's question and answer
      if (n.question) {
        context.push(`Q: ${n.question}`)
      }
      if (n.answer) {
        context.push(`A: ${n.answer}`)
      }
    }
    
    buildPath(currentNode.id)
    return context.join('\n')
  }

  const buildDisplayThread = (currentNode: TreeNode): string => {
    const thread: string[] = []
    const visited = new Set<string>()
    
    // Build the conversation path from root to current node
    const buildPath = (nodeId: string): void => {
      // Prevent infinite recursion
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      const n = allNodes.find(n => n.id === nodeId)
      if (!n) return
      
      // Add parent first (recursive)
      if (n.parentId && !visited.has(n.parentId)) {
        buildPath(n.parentId)
      }
      
      // Only add answers to create a clean story draft
      if (n.answer) {
        thread.push(n.answer)
      }
    }
    
    buildPath(currentNode.id)
    return thread.join('\n\n')
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLikeAndContinue = async () => {
    console.log('❤️ Like button clicked - auto-continuing story:', {
      node: node.id,
      aiProvider,
      hasOpenaiKey: !!openaiKey,
      hasGeminiKey: !!geminiKey,
      responseLanguage,
      defaultNumAnswers,
      defaultResponseLength
    })

    onUpdateNode(node.id, {
      isGenerating: true,
    })

    try {
      const apiKey = aiProvider === 'openai' ? openaiKey : geminiKey
      const context = buildContext(node)
      
      console.log('📝 Auto-continue context:', context)
      console.log('🔑 Auto-continue API key:', apiKey ? apiKey.substring(0, 8) + '...' : 'none')
      
      // Generate story continuation with a detailed prompt
      const continuePrompt = "Continue this story with creative and engaging narrative. Develop the plot further, introduce new elements, conflicts, or character development. Write naturally flowing prose that builds upon what came before."
      const answers = await generateAnswers(continuePrompt, apiKey, responseLanguage, aiProvider, defaultNumAnswers, context, defaultResponseLength)
      
      console.log('✅ Auto-continue answers:', answers)
      
      const newNodes = answers.slice(0, defaultNumAnswers).map((answer, index) => ({
        id: `${node.id}-like-${Date.now()}-${index}`,
        answer: answer.trim(),
        parentId: node.id,
      }))

      console.log('📋 Auto-continue new nodes:', newNodes)

      onAddNodes(newNodes)
      onUpdateNode(node.id, { isGenerating: false })
      setIsExpanded(true)
    } catch (error) {
      console.error("❌ Error generating story continuation:", error)
      onUpdateNode(node.id, { 
        isGenerating: false, 
      })
    }
  }

  const handleDislike = () => {
    console.log('💔 Dislike button clicked - removing node:', {
      node: node.id,
      answer: node.answer?.substring(0, 50) + '...'
    })
    
    // Delete this node and all its children
    onDeleteNode(node.id)
  }

  const handleSaveStoryDraft = () => {
    setSavingDraft(true)
    
    try {
      const storyContent = buildDisplayThread(node)
      const draft = {
        id: `draft-${Date.now()}`,
        title: storyContent.substring(0, 50) + (storyContent.length > 50 ? '...' : ''),
        content: storyContent,
        createdAt: new Date().toISOString(),
        nodeId: node.id
      }
      
      const existingDrafts = JSON.parse(localStorage.getItem('story-drafts') || '[]')
      const updatedDrafts = [draft, ...existingDrafts]
      localStorage.setItem('story-drafts', JSON.stringify(updatedDrafts))
      
      // Show success feedback
      setTimeout(() => {
        setSavingDraft(false)
        setShowConversationThread(false)
      }, 500)
      
    } catch (error) {
      console.error('Error saving draft:', error)
      setSavingDraft(false)
    }
  }

  const handleStartEdit = () => {
    setEditInput(node.answer || "")
    onUpdateNode(node.id, { showEditInput: true })
  }

  const handleSaveEdit = () => {
    onUpdateNode(node.id, { 
      answer: editInput.trim(),
      showEditInput: false 
    })
    setEditInput("")
  }

  const handleCancelEdit = () => {
    onUpdateNode(node.id, { showEditInput: false })
    setEditInput("")
  }

  return (
    <div className="mb-2">
      <div className="flex items-start gap-2" style={{ marginLeft: `${level * 16}px` }}>
        {/* Expand/Collapse Button */}
        <div className="w-5 flex justify-center pt-0.5">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className="h-5 w-5 hover:bg-muted"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
        </div>

        <div className="flex-1">
          {/* Answer Display */}
          {node.answer && (
            <div className="border border-border rounded-md p-3 mb-3 bg-card">
              {node.showEditInput ? (
                <div className="space-y-3">
                  <Input
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    placeholder="Edit response..."
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editInput.trim()}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="text-foreground flex-1 text-sm leading-relaxed">{node.answer}</div>
                  <div className="flex gap-1 ml-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleStartEdit}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      title="Edit this response"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDeleteNode(node.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Delete this answer"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Action Buttons - Like, Dislike, and Preview */}
              {!node.isGenerating && !node.showEditInput && (
                <div className="mt-3 pt-2 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleLikeAndContinue}
                      className="h-7 text-xs bg-pink-600 hover:bg-pink-700"
                      disabled={node.isGenerating}
                    >
                      <Heart className="h-3 w-3 mr-1" />
                      Like & Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDislike}
                      className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                      disabled={node.isGenerating}
                    >
                      <HeartCrack className="h-3 w-3 mr-1" />
                      Dislike
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowConversationThread(true)}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Preview Story
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question Display (for root node) */}
          {node.question && (
            <div className="flex justify-between items-start mb-2">
              <p className="text-primary flex-1 text-sm font-medium">{node.question}</p>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onClearQuestion(node.id)}
                className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                title="Clear this question"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Loading State */}
          {node.isGenerating && (
            <div className="flex items-center gap-2 py-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating story continuation...</span>
            </div>
          )}

        </div>
      </div>

      {/* Child Nodes */}
      {hasChildren && isExpanded && (
        <div className="mt-2">
          {children.map((child) => (
            <SimpleTreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              allNodes={allNodes}
              openaiKey={openaiKey}
              geminiKey={geminiKey}
              aiProvider={aiProvider}
              responseLanguage={responseLanguage}
              defaultNumAnswers={defaultNumAnswers}
              defaultResponseLength={defaultResponseLength}
              onUpdateNode={onUpdateNode}
              onAddNodes={onAddNodes}
              onDeleteNode={onDeleteNode}
              onClearQuestion={onClearQuestion}
            />
          ))}
        </div>
      )}

      {/* Conversation Thread Modal */}
      {showConversationThread && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Story Preview</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowConversationThread(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {buildDisplayThread(node)}
              </pre>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                size="sm"
                onClick={handleSaveStoryDraft}
                disabled={savingDraft}
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    Save as Story
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const thread = buildDisplayThread(node)
                  navigator.clipboard.writeText(thread)
                  setShowConversationThread(false)
                }}
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConversationThread(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}