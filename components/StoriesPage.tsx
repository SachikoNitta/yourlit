"use client"

import { useState, useEffect } from "react"
import { Draft, StoryVersion, draftsStorage } from "../lib/draftsStorage"
import { storyGenerationService, GenerationParams } from "../lib/ai"
import { DraftsList } from "./drafts/DraftsList"
import { DraftViewer } from "./drafts/DraftViewer"
import { VersionViewer } from "./drafts/VersionViewer"
import { VersionsList } from "./drafts/VersionsList"
import { VersionCreationModal } from "./drafts/VersionCreationModal"
import { VersionEditor } from "./drafts/VersionEditor"
import { CharacterExtractionDialog } from "./character-extraction/CharacterExtractionDialog"
import { CharacterExtractionResult } from "@/lib/services/characterService"
import { getServiceManager } from "@/lib/services"
import { loadSettings, AppSettings } from "@/lib/settings"

interface StoriesPageProps {
  openaiKey: string
  geminiKey: string
  aiProvider: 'openai' | 'gemini'
  responseLanguage: string
  isHydrated: boolean
}

export function StoriesPage({
  openaiKey,
  geminiKey,
  aiProvider,
  responseLanguage,
  isHydrated
}: StoriesPageProps) {
  const [savedDrafts, setSavedDrafts] = useState<Draft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<StoryVersion | null>(null)
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showVersionEditor, setShowVersionEditor] = useState(false)
  const [showCharacterExtractionDialog, setShowCharacterExtractionDialog] = useState(false)
  const [extractionContent, setExtractionContent] = useState('')
  const [extractionTitle, setExtractionTitle] = useState('')
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    if (isHydrated) {
      loadData()
      setSettings(loadSettings())
    }
  }, [isHydrated])

  const loadData = () => {
    setSavedDrafts(draftsStorage.loadDrafts())
  }

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = draftsStorage.deleteDraft(draftId)
    setSavedDrafts(updatedDrafts)
    
    if (selectedDraft?.id === draftId) {
      setSelectedDraft(null)
    }
  }

  const handleDeleteVersion = (versionId: string) => {
    draftsStorage.deleteVersion(versionId)
    
    if (selectedVersion?.id === versionId) {
      setSelectedVersion(null)
    }
  }

  const handleUpdateDraft = (draftId: string, updates: { title?: string; content?: string }) => {
    const updatedDrafts = draftsStorage.updateDraft(draftId, updates)
    setSavedDrafts(updatedDrafts)
    
    // Update selectedDraft if it's the one being edited
    if (selectedDraft?.id === draftId) {
      const updatedDraft = updatedDrafts.find(d => d.id === draftId)
      if (updatedDraft) {
        setSelectedDraft(updatedDraft)
      }
    }
  }

  const handleUpdateVersion = (versionId: string, updates: { title?: string; content?: string; prompt?: string }) => {
    draftsStorage.updateVersion(versionId, updates)
    
    // Update selectedVersion if it's the one being edited
    if (selectedVersion?.id === versionId) {
      const updatedVersion = draftsStorage.getVersion(versionId)
      if (updatedVersion) {
        setSelectedVersion(updatedVersion)
      }
    }
  }

  const handleGenerateVersion = async (instructions: string) => {
    if (!selectedDraft) return
    
    setIsGeneratingStory(true)
    try {
      const generationParams: GenerationParams = {
        openaiKey,
        geminiKey,
        aiProvider,
        responseLanguage
      }
      
      const newVersion = await storyGenerationService.generateVersion(
        selectedDraft,
        instructions,
        generationParams
      )
      
      draftsStorage.addVersion(newVersion)
      setShowVersionModal(false)
    } catch (error) {
      console.error('❌ Error generating story:', error)
    } finally {
      setIsGeneratingStory(false)
    }
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleExtractCharacters = (content: string, title: string) => {
    setExtractionContent(content)
    setExtractionTitle(title)
    setShowCharacterExtractionDialog(true)
  }

  const performCharacterExtraction = async (content: string): Promise<CharacterExtractionResult> => {
    const settings = loadSettings()
    const serviceManager = getServiceManager(settings)
    const characterService = serviceManager.characters
    
    const extractionParams = {
      openaiKey,
      geminiKey,
      aiProvider,
      responseLanguage
    }
    
    return await characterService.extractCharactersFromStory(
      content,
      extractionParams,
      selectedDraft?.id,
      selectedDraft?.nodeId
    )
  }

  const getVersionsForCurrentDraft = (): StoryVersion[] => {
    if (!selectedDraft) return []
    return draftsStorage.getVersionsForDraft(selectedDraft.id)
  }

  return (
    <div className="ml-12 w-[calc(100vw-3rem)] p-6">
      <div className="w-full">
        {showVersionEditor && selectedDraft ? (
          <VersionEditor
            draft={selectedDraft}
            onGoBack={() => setShowVersionEditor(false)}
            onSaveVersion={(version) => {
              draftsStorage.addVersion(version)
              loadData() // Reload data to show the new version
            }}
            onCopyToClipboard={handleCopyToClipboard}
            openaiKey={openaiKey}
            geminiKey={geminiKey}
            aiProvider={aiProvider}
            responseLanguage={responseLanguage}
          />
        ) : selectedVersion ? (
          <VersionViewer
            version={selectedVersion}
            onGoBack={() => setSelectedVersion(null)}
            onDelete={handleDeleteVersion}
            onCopyToClipboard={handleCopyToClipboard}
            onUpdateVersion={handleUpdateVersion}
          />
        ) : selectedDraft ? (
          <>
            <DraftViewer
              draft={selectedDraft}
              onGoBack={() => setSelectedDraft(null)}
              onDelete={handleDeleteDraft}
              onCreateVersion={() => setShowVersionModal(true)}
              onCreateVersionAdvanced={() => setShowVersionEditor(true)}
              onCopyToClipboard={handleCopyToClipboard}
              onExtractCharacters={() => handleExtractCharacters(selectedDraft.content, selectedDraft.title)}
              onUpdateDraft={handleUpdateDraft}
              settings={settings || undefined}
            />
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Versions</h2>
              <VersionsList
                versions={getVersionsForCurrentDraft()}
                onSelectVersion={setSelectedVersion}
                onDeleteVersion={handleDeleteVersion}
              />
            </div>
          </>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Stories</h1>
            <DraftsList
              drafts={savedDrafts}
              onSelectDraft={setSelectedDraft}
              onDeleteDraft={handleDeleteDraft}
            />
          </div>
        )}
      </div>

      <VersionCreationModal
        isVisible={showVersionModal}
        draft={selectedDraft}
        isGenerating={isGeneratingStory}
        onClose={() => setShowVersionModal(false)}
        onGenerate={handleGenerateVersion}
      />
      
      <CharacterExtractionDialog
        isOpen={showCharacterExtractionDialog}
        onClose={() => setShowCharacterExtractionDialog(false)}
        onExtract={performCharacterExtraction}
        content={extractionContent}
        title={extractionTitle}
      />
    </div>
  )
}