import { TreeNode } from '../app/trees/types'

export interface TextToTreeOptions {
  title?: string
  splitByParagraphs?: boolean
  splitBySentences?: boolean
  customSeparator?: string
}

export function convertTextToTree(
  text: string, 
  options: TextToTreeOptions = {}
): TreeNode[] {
  const {
    title = "Imported Story",
    splitByParagraphs = true,
    splitBySentences = false,
    customSeparator
  } = options

  if (!text.trim()) {
    return []
  }

  let segments: string[]

  if (customSeparator) {
    segments = text.split(customSeparator)
  } else if (splitBySentences) {
    // Split by sentences (periods, exclamation marks, question marks)
    segments = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  } else if (splitByParagraphs) {
    // Split by paragraphs (double line breaks or single line breaks)
    segments = text.split(/\n\s*\n|\n/).filter(s => s.trim().length > 0)
  } else {
    segments = [text]
  }

  // Clean up segments
  segments = segments
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0)

  if (segments.length === 0) {
    return []
  }

  const timestamp = Date.now()
  const nodes: TreeNode[] = []

  // Create root node with title/first segment as question
  const rootNode: TreeNode = {
    id: 'root',
    question: title,
  }
  nodes.push(rootNode)

  // Create response nodes for each segment
  segments.forEach((segment, index) => {
    const nodeId = `imported-${timestamp}-${index}`
    const responseNode: TreeNode = {
      id: nodeId,
      answer: segment,
      parentId: index === 0 ? 'root' : `imported-${timestamp}-${index - 1}`,
    }
    nodes.push(responseNode)
  })

  return nodes
}

export function parseTextToTreePreview(
  text: string, 
  options: TextToTreeOptions = {}
): { segments: string[], nodeCount: number, previewText: string } {
  const {
    splitByParagraphs = true,
    splitBySentences = false,
    customSeparator
  } = options

  if (!text.trim()) {
    return { segments: [], nodeCount: 0, previewText: '' }
  }

  let segments: string[]

  if (customSeparator) {
    segments = text.split(customSeparator)
  } else if (splitBySentences) {
    segments = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  } else if (splitByParagraphs) {
    segments = text.split(/\n\s*\n|\n/).filter(s => s.trim().length > 0)
  } else {
    segments = [text]
  }

  // Clean up segments
  segments = segments
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0)

  const nodeCount = segments.length + 1 // +1 for root node
  const previewText = segments
    .slice(0, 3)
    .map((segment, index) => `${index + 1}. ${segment.substring(0, 100)}${segment.length > 100 ? '...' : ''}`)
    .join('\n')

  return { segments, nodeCount, previewText }
}