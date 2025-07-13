// Repository factory to create appropriate repository implementations

import { AppSettings } from '../settings'
import { initializeFirebase, isFirebaseInitialized } from '../firestore'
import { 
  RepositoryFactory, 
  TreeRepository, 
  StoryRepository, 
  UserRepository 
} from './types'
import { 
  LocalStorageTreeRepository, 
  LocalStorageStoryRepository, 
  LocalStorageUserRepository 
} from './localStorage'
import { 
  FirestoreTreeRepository, 
  FirestoreStoryRepository, 
  FirestoreUserRepository 
} from './firestore'

export class ConcreteRepositoryFactory implements RepositoryFactory {
  constructor(private settings: AppSettings) {}

  createTreeRepository(): TreeRepository {
    if (this.settings.storageType === 'firestore') {
      if (this.ensureFirestoreInitialized()) {
        return new FirestoreTreeRepository()
      }
      console.warn('Firestore not available, falling back to localStorage for trees')
    }
    return new LocalStorageTreeRepository()
  }

  createStoryRepository(): StoryRepository {
    if (this.settings.storageType === 'firestore') {
      if (this.ensureFirestoreInitialized()) {
        return new FirestoreStoryRepository()
      }
      console.warn('Firestore not available, falling back to localStorage for stories')
    }
    return new LocalStorageStoryRepository()
  }

  createUserRepository(): UserRepository {
    if (this.settings.storageType === 'firestore') {
      if (this.ensureFirestoreInitialized()) {
        return new FirestoreUserRepository()
      }
      console.warn('Firestore not available, falling back to localStorage for user data')
    }
    return new LocalStorageUserRepository()
  }

  private ensureFirestoreInitialized(): boolean {
    if (isFirebaseInitialized()) {
      return true
    }

    if (!this.settings.firebaseApiKey || !this.settings.firebaseProjectId) {
      return false
    }

    return initializeFirebase(this.settings)
  }
}

// Singleton factory instance
let factoryInstance: ConcreteRepositoryFactory | null = null

export const getRepositoryFactory = (settings: AppSettings): RepositoryFactory => {
  // Create new factory if settings changed or no factory exists
  if (!factoryInstance || shouldRecreateFactory(settings)) {
    factoryInstance = new ConcreteRepositoryFactory(settings)
  }
  return factoryInstance
}

// Helper to determine if we need to recreate the factory
function shouldRecreateFactory(newSettings: AppSettings): boolean {
  if (!factoryInstance) return true
  
  const currentSettings = (factoryInstance as any).settings as AppSettings
  
  return (
    currentSettings.storageType !== newSettings.storageType ||
    currentSettings.firebaseApiKey !== newSettings.firebaseApiKey ||
    currentSettings.firebaseProjectId !== newSettings.firebaseProjectId
  )
}

// Convenience functions for common repository operations
export class RepositoryManager {
  private factory: RepositoryFactory

  constructor(settings: AppSettings) {
    this.factory = getRepositoryFactory(settings)
  }

  get trees(): TreeRepository {
    return this.factory.createTreeRepository()
  }

  get stories(): StoryRepository {
    return this.factory.createStoryRepository()
  }

  get user(): UserRepository {
    return this.factory.createUserRepository()
  }

  // Update settings and recreate repositories if needed
  updateSettings(settings: AppSettings): void {
    this.factory = getRepositoryFactory(settings)
  }
}

// Global repository manager instance
let repositoryManager: RepositoryManager | null = null

export const getRepositoryManager = (settings: AppSettings): RepositoryManager => {
  if (!repositoryManager) {
    repositoryManager = new RepositoryManager(settings)
  } else {
    repositoryManager.updateSettings(settings)
  }
  return repositoryManager
}