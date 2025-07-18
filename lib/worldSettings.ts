export interface WorldSetting {
  id: string
  name: string
  description: string
  genre: string
  tags: string[]
  details: {
    timePeriod?: string
    location?: string
    technology?: string
    magic?: string
    politics?: string
    culture?: string
    climate?: string
    creatures?: string
    rules?: string
    conflicts?: string
  }
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export const worldSettingsStorage = {
  // World settings operations
  loadWorldSettings(): WorldSetting[] {
    try {
      const settings = localStorage.getItem('world-settings')
      return settings ? JSON.parse(settings) : []
    } catch (error) {
      console.error('Error loading world settings:', error)
      return []
    }
  },

  saveWorldSettings(settings: WorldSetting[]): void {
    try {
      localStorage.setItem('world-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving world settings:', error)
    }
  },

  addWorldSetting(setting: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>): WorldSetting {
    const newSetting: WorldSetting = {
      ...setting,
      id: `world-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const settings = this.loadWorldSettings()
    const updatedSettings = [newSetting, ...settings]
    this.saveWorldSettings(updatedSettings)
    
    return newSetting
  },

  updateWorldSetting(id: string, updates: Partial<Omit<WorldSetting, 'id' | 'createdAt'>>): WorldSetting[] {
    const settings = this.loadWorldSettings()
    const updatedSettings = settings.map(setting => 
      setting.id === id 
        ? { ...setting, ...updates, updatedAt: new Date().toISOString() }
        : setting
    )
    this.saveWorldSettings(updatedSettings)
    return updatedSettings
  },

  deleteWorldSetting(id: string): WorldSetting[] {
    const settings = this.loadWorldSettings()
    const updatedSettings = settings.filter(setting => setting.id !== id)
    this.saveWorldSettings(updatedSettings)
    return updatedSettings
  },

  setActiveWorldSetting(id: string): WorldSetting[] {
    const settings = this.loadWorldSettings()
    const updatedSettings = settings.map(setting => ({
      ...setting,
      isActive: setting.id === id,
      updatedAt: setting.id === id ? new Date().toISOString() : setting.updatedAt
    }))
    this.saveWorldSettings(updatedSettings)
    return updatedSettings
  },

  getActiveWorldSetting(): WorldSetting | null {
    const settings = this.loadWorldSettings()
    return settings.find(setting => setting.isActive) || null
  },

  duplicateWorldSetting(id: string): WorldSetting | null {
    const settings = this.loadWorldSettings()
    const originalSetting = settings.find(setting => setting.id === id)
    
    if (!originalSetting) return null
    
    const duplicatedSetting: WorldSetting = {
      ...originalSetting,
      id: `world-${Date.now()}`,
      name: `${originalSetting.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false
    }
    
    const updatedSettings = [duplicatedSetting, ...settings]
    this.saveWorldSettings(updatedSettings)
    
    return duplicatedSetting
  }
}

// Predefined world setting templates
export const worldSettingTemplates: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>[] = [
  {
    name: "Space Fantasy",
    description: "A universe where magic and technology coexist among the stars",
    genre: "Science Fantasy",
    tags: ["space", "magic", "technology", "aliens", "starships"],
    details: {
      timePeriod: "Far future",
      location: "Multiple star systems",
      technology: "Advanced starships, energy weapons, AI",
      magic: "Cosmic magic, elemental powers",
      politics: "Galactic federation with rebel factions",
      culture: "Diverse alien civilizations",
      climate: "Varies by planet",
      creatures: "Alien species, space dragons, energy beings",
      rules: "Magic works through crystal technology",
      conflicts: "Empire vs rebels, ancient awakening powers"
    }
  },
  {
    name: "Medieval Fantasy",
    description: "Classic fantasy realm with knights, wizards, and dragons",
    genre: "High Fantasy",
    tags: ["medieval", "magic", "knights", "dragons", "kingdoms"],
    details: {
      timePeriod: "Medieval period",
      location: "Fantasy kingdoms and realms",
      technology: "Medieval weapons, basic machinery",
      magic: "Wizardry, divine magic, enchantments",
      politics: "Feudal kingdoms, royal courts",
      culture: "Medieval European inspired",
      climate: "Temperate with magical variations",
      creatures: "Dragons, unicorns, orcs, elves",
      rules: "Magic requires study and components",
      conflicts: "Kingdom wars, ancient evils returning"
    }
  },
  {
    name: "Cyberpunk City",
    description: "Dark future urban setting with high tech and low life",
    genre: "Cyberpunk",
    tags: ["cyberpunk", "technology", "corporate", "hackers", "dystopia"],
    details: {
      timePeriod: "Near future (2070-2100)",
      location: "Mega-city with corporate districts",
      technology: "Cybernetics, AI, virtual reality, flying cars",
      magic: "None (pure technology)",
      politics: "Corporate oligarchy, underground resistance",
      culture: "High-tech, multicultural, class divided",
      climate: "Polluted, acid rain, climate controlled zones",
      creatures: "Humans, cyborgs, AI entities",
      rules: "Technology dominates, corporations control everything",
      conflicts: "Corporate wars, hacker vs system, class struggle"
    }
  },
  {
    name: "Steampunk Victorian",
    description: "Victorian era with steam-powered technology and adventure",
    genre: "Steampunk",
    tags: ["steampunk", "victorian", "steam", "airships", "adventure"],
    details: {
      timePeriod: "Alternative Victorian era",
      location: "Steam-powered cities and countries",
      technology: "Steam engines, clockwork, airships, brass machinery",
      magic: "Minimal - mostly alchemy and spiritualism",
      politics: "Imperial powers, inventor guilds",
      culture: "Victorian manners with industrial revolution",
      climate: "Industrial smog, varied by region",
      creatures: "Humans, mechanical constructs, rare supernatural",
      rules: "Steam power enables impossible machines",
      conflicts: "Industrial espionage, colonial expansion, class tensions"
    }
  },
  {
    name: "Post-Apocalyptic Wasteland",
    description: "Survivors in a world after civilization's collapse",
    genre: "Post-Apocalyptic",
    tags: ["post-apocalyptic", "survival", "wasteland", "mutants", "scavenging"],
    details: {
      timePeriod: "100 years after the collapse",
      location: "Ruined cities and wasteland",
      technology: "Scavenged pre-war tech, improvised weapons",
      magic: "Radiation-induced mutations",
      politics: "Tribal settlements, warlords, trading posts",
      culture: "Survival-focused, resource scarcity",
      climate: "Harsh, irradiated, extreme weather",
      creatures: "Mutated animals, humans, rare survivors",
      rules: "Resources are scarce, trust is rare",
      conflicts: "Resource wars, survival vs humanity, mutant acceptance"
    }
  }
]