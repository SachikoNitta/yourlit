"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, User, Wand2, Loader2 } from 'lucide-react'
import { CharacterExtractionResult } from '@/lib/services/characterService'

interface CharacterExtractionDialogProps {
  isOpen: boolean
  onClose: () => void
  onExtract: (content: string) => Promise<CharacterExtractionResult>
  content: string
  title: string
}

export const CharacterExtractionDialog: React.FC<CharacterExtractionDialogProps> = ({
  isOpen,
  onClose,
  onExtract,
  content,
  title
}) => {
  const [extractionResult, setExtractionResult] = useState<CharacterExtractionResult | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [hasExtracted, setHasExtracted] = useState(false)

  const handleExtract = async () => {
    setIsExtracting(true)
    try {
      const result = await onExtract(content)
      setExtractionResult(result)
      setHasExtracted(true)
    } catch (error) {
      console.error('Error extracting characters:', error)
      setExtractionResult({
        characters: [],
        extractedCount: 0,
        errors: [`Failed to extract characters: ${error}`]
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleClose = () => {
    setExtractionResult(null)
    setHasExtracted(false)
    setIsExtracting(false)
    onClose()
  }

  const renderPreview = () => {
    const preview = content.substring(0, 300)
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Story Preview:</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {preview}
          {content.length > 300 && '...'}
        </p>
      </div>
    )
  }

  const renderExtractionResult = () => {
    if (!extractionResult) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-semibold">
            Extracted {extractionResult.extractedCount} character{extractionResult.extractedCount !== 1 ? 's' : ''}
          </span>
        </div>

        {extractionResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">Errors:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {extractionResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {extractionResult.characters.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Extracted Characters:</h4>
            <div className="grid grid-cols-1 gap-3">
              {extractionResult.characters.map((character, index) => (
                <Card key={index} className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <CardTitle className="text-sm">{character.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {character.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {character.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {character.traits.map((trait, traitIndex) => (
                          <Badge key={traitIndex} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {character.appearance && (
                      <div className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">Appearance:</span> {character.appearance}
                      </div>
                    )}
                    {character.backstory && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Backstory:</span> {character.backstory}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Extract Characters
          </DialogTitle>
          <DialogDescription>
            Extract characters from "{title}" and save them to your character library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!hasExtracted && (
            <>
              {renderPreview()}
              <div className="text-center">
                <Button 
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="flex items-center gap-2"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Extract Characters
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {hasExtracted && renderExtractionResult()}

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {hasExtracted ? 'Close' : 'Cancel'}
            </Button>
            {hasExtracted && extractionResult && extractionResult.extractedCount > 0 && (
              <Button onClick={handleClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}