// Story service using repository layer

import { StoryRepository, StoryDraft, StoryVersion } from '../repositories/types'

export class StoryService {
  constructor(private storyRepository: StoryRepository) {}

  // Draft management
  async createDraft(title: string, content: string, nodeId: string): Promise<StoryDraft> {
    return await this.storyRepository.createDraft({
      title,
      content,
      nodeId,
      createdAt: new Date().toISOString()
    })
  }

  async getDraft(id: string): Promise<StoryDraft | null> {
    return await this.storyRepository.getDraft(id)
  }

  async getAllDrafts(): Promise<StoryDraft[]> {
    const drafts = await this.storyRepository.getAllDrafts()
    // Sort by creation date, most recent first
    return drafts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async updateDraft(id: string, updates: Partial<StoryDraft>): Promise<void> {
    await this.storyRepository.updateDraft(id, updates)
  }

  async deleteDraft(id: string): Promise<void> {
    await this.storyRepository.deleteDraft(id)
  }

  // Version management
  async createVersion(
    draftId: string, 
    instructions: string, 
    content: string,
    title?: string
  ): Promise<StoryVersion> {
    const draft = await this.getDraft(draftId)
    if (!draft) {
      throw new Error(`Draft with id ${draftId} not found`)
    }

    return await this.storyRepository.createVersion({
      draftId,
      title: title || `${draft.title} - Version`,
      content,
      instructions,
      createdAt: new Date().toISOString()
    })
  }

  async getVersion(id: string): Promise<StoryVersion | null> {
    return await this.storyRepository.getVersion(id)
  }

  async getVersionsForDraft(draftId: string): Promise<StoryVersion[]> {
    const versions = await this.storyRepository.getVersionsForDraft(draftId)
    // Sort by creation date, most recent first
    return versions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getAllVersions(): Promise<StoryVersion[]> {
    const versions = await this.storyRepository.getAllVersions()
    // Sort by creation date, most recent first
    return versions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async updateVersion(id: string, updates: Partial<StoryVersion>): Promise<void> {
    await this.storyRepository.updateVersion(id, updates)
  }

  async deleteVersion(id: string): Promise<void> {
    await this.storyRepository.deleteVersion(id)
  }

  // Utility methods
  async getDraftWithVersions(draftId: string): Promise<{
    draft: StoryDraft | null
    versions: StoryVersion[]
  }> {
    const [draft, versions] = await Promise.all([
      this.getDraft(draftId),
      this.getVersionsForDraft(draftId)
    ])

    return { draft, versions }
  }

  async searchDrafts(query: string): Promise<StoryDraft[]> {
    const drafts = await this.getAllDrafts()
    const lowerQuery = query.toLowerCase()
    
    return drafts.filter(draft => 
      draft.title.toLowerCase().includes(lowerQuery) ||
      draft.content.toLowerCase().includes(lowerQuery)
    )
  }

  async searchVersions(query: string): Promise<StoryVersion[]> {
    const versions = await this.getAllVersions()
    const lowerQuery = query.toLowerCase()
    
    return versions.filter(version => 
      version.title.toLowerCase().includes(lowerQuery) ||
      version.content.toLowerCase().includes(lowerQuery) ||
      version.instructions.toLowerCase().includes(lowerQuery)
    )
  }

  async getStorageStats(): Promise<{
    totalDrafts: number
    totalVersions: number
    totalSize: number // Approximate size in characters
  }> {
    const [drafts, versions] = await Promise.all([
      this.getAllDrafts(),
      this.getAllVersions()
    ])

    const totalSize = [...drafts, ...versions].reduce((size, item) => {
      return size + item.title.length + item.content.length + 
        ('instructions' in item ? item.instructions.length : 0)
    }, 0)

    return {
      totalDrafts: drafts.length,
      totalVersions: versions.length,
      totalSize
    }
  }

  // Content formatting helpers
  formatDraftForExport(draft: StoryDraft): string {
    return `# ${draft.title}\n\n${draft.content}\n\n---\nCreated: ${new Date(draft.createdAt).toLocaleString()}`
  }

  formatVersionForExport(version: StoryVersion): string {
    return `# ${version.title}\n\n## Instructions\n${version.instructions}\n\n## Content\n${version.content}\n\n---\nCreated: ${new Date(version.createdAt).toLocaleString()}`
  }

  // Data cleanup
  async cleanupOrphanedVersions(): Promise<number> {
    const [drafts, versions] = await Promise.all([
      this.getAllDrafts(),
      this.getAllVersions()
    ])

    const draftIds = new Set(drafts.map(draft => draft.id))
    const orphanedVersions = versions.filter(version => !draftIds.has(version.draftId))

    // Delete orphaned versions
    await Promise.all(
      orphanedVersions.map(version => this.deleteVersion(version.id))
    )

    return orphanedVersions.length
  }
}