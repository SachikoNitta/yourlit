// Repository layer exports

// Types and interfaces
export * from './types'

// Implementations
export * from './localStorage'
export * from './firestore'

// Factory and manager
export * from './factory'

// Re-export for convenience
export { getRepositoryManager, RepositoryManager } from './factory'