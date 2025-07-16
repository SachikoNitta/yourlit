export interface Draft {
  id: string
  title: string
  content: string
  createdAt: string
  nodeId?: string
}

export interface StoryVersion {
  id: string
  title: string
  content: string
  prompt: string
  originalDraftId: string
  createdAt: string
}

export const draftsStorage = {
  // Draft operations
  loadDrafts(): Draft[] {
    try {
      const drafts = localStorage.getItem('story-drafts')
      return drafts ? JSON.parse(drafts) : []
    } catch (error) {
      console.error('Error loading drafts:', error)
      return []
    }
  },

  saveDrafts(drafts: Draft[]): void {
    try {
      localStorage.setItem('story-drafts', JSON.stringify(drafts))
    } catch (error) {
      console.error('Error saving drafts:', error)
    }
  },

  deleteDraft(draftId: string): Draft[] {
    const drafts = this.loadDrafts()
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId)
    this.saveDrafts(updatedDrafts)
    return updatedDrafts
  },

  updateDraft(draftId: string, updates: Partial<Omit<Draft, 'id'>>): Draft[] {
    const drafts = this.loadDrafts()
    const updatedDrafts = drafts.map(draft => 
      draft.id === draftId 
        ? { ...draft, ...updates }
        : draft
    )
    this.saveDrafts(updatedDrafts)
    return updatedDrafts
  },

  // Story version operations
  loadVersions(): StoryVersion[] {
    try {
      const versions = localStorage.getItem('generated-stories')
      return versions ? JSON.parse(versions) : []
    } catch (error) {
      console.error('Error loading versions:', error)
      return []
    }
  },

  saveVersions(versions: StoryVersion[]): void {
    try {
      localStorage.setItem('generated-stories', JSON.stringify(versions))
    } catch (error) {
      console.error('Error saving versions:', error)
    }
  },

  addVersion(version: StoryVersion): StoryVersion[] {
    const existingVersions = this.loadVersions()
    const updatedVersions = [version, ...existingVersions]
    this.saveVersions(updatedVersions)
    return updatedVersions
  },

  deleteVersion(versionId: string): StoryVersion[] {
    const versions = this.loadVersions()
    const updatedVersions = versions.filter(version => version.id !== versionId)
    this.saveVersions(updatedVersions)
    return updatedVersions
  },

  getVersionsForDraft(draftId: string): StoryVersion[] {
    const allVersions = this.loadVersions()
    return allVersions.filter(version => version.originalDraftId === draftId)
  },

  updateVersion(versionId: string, updates: Partial<Omit<StoryVersion, 'id'>>): StoryVersion[] {
    const versions = this.loadVersions()
    const updatedVersions = versions.map(version => 
      version.id === versionId 
        ? { ...version, ...updates }
        : version
    )
    this.saveVersions(updatedVersions)
    return updatedVersions
  },

  getVersion(versionId: string): StoryVersion | null {
    const versions = this.loadVersions()
    return versions.find(version => version.id === versionId) || null
  }
}