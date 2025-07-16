// Services layer exports

export * from './treeService'
export * from './storyService'
export * from './characterService'

// Service factory
import { TreeService } from './treeService'
import { StoryService } from './storyService'
import { CharacterService } from './characterService'
import { RepositoryManager } from '../repositories'
import { AppSettings } from '../settings'

export class ServiceManager {
  private repositoryManager: RepositoryManager
  private treeServiceInstance: TreeService | null = null
  private storyServiceInstance: StoryService | null = null
  private characterServiceInstance: CharacterService | null = null

  constructor(settings: AppSettings) {
    this.repositoryManager = new RepositoryManager(settings)
  }

  get trees(): TreeService {
    if (!this.treeServiceInstance) {
      this.treeServiceInstance = new TreeService(this.repositoryManager.trees)
    }
    return this.treeServiceInstance
  }

  get stories(): StoryService {
    if (!this.storyServiceInstance) {
      this.storyServiceInstance = new StoryService(this.repositoryManager.stories)
    }
    return this.storyServiceInstance
  }

  get user() {
    return this.repositoryManager.user
  }

  get characters(): CharacterService {
    if (!this.characterServiceInstance) {
      this.characterServiceInstance = new CharacterService(this.repositoryManager.characters)
    }
    return this.characterServiceInstance
  }

  // Update settings and invalidate service instances
  updateSettings(settings: AppSettings): void {
    this.repositoryManager.updateSettings(settings)
    // Invalidate service instances so they get recreated with new repositories
    this.treeServiceInstance = null
    this.storyServiceInstance = null
    this.characterServiceInstance = null
  }
}

// Global service manager instance
let serviceManager: ServiceManager | null = null

export const getServiceManager = (settings: AppSettings): ServiceManager => {
  if (!serviceManager) {
    serviceManager = new ServiceManager(settings)
  } else {
    serviceManager.updateSettings(settings)
  }
  return serviceManager
}