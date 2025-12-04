"use client"

import { useState } from "react"
import { X, Plus, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PREDEFINED_TAGS, type Tag } from "@/types/tag"

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [customTagName, setCustomTagName] = useState("")
  const [availableTags, setAvailableTags] = useState<Tag[]>(PREDEFINED_TAGS)

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  const handleAddCustomTag = () => {
    if (!customTagName.trim()) return

    const newTag: Tag = {
      id: `custom-${Date.now()}`,
      name: customTagName,
      color: "#6B7280",
      count: 0,
    }

    setAvailableTags((prev) => [...prev, newTag])
    onTagsChange([...selectedTags, newTag.id])
    setCustomTagName("")
  }

  const selectedTagObjects = availableTags.filter((tag) => selectedTags.includes(tag.id))

  return (
    <div className="space-y-3">
      <Label>Tags e Categorias</Label>

      <div className="flex flex-wrap gap-2">
        {selectedTagObjects.map((tag) => (
          <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white px-3 py-1 gap-1">
            {tag.name}
            <button
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 bg-transparent">
              <Plus className="h-3 w-3" />
              Adicionar tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Selecione uma categoria</h4>
                <div className="grid gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
                          isSelected
                            ? "bg-teal-50 dark:bg-teal-900/20 border-[#00A99D]"
                            : "hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                          <div className="text-left">
                            <div className="text-sm font-medium">{tag.name}</div>
                            {tag.description && <div className="text-xs text-muted-foreground">{tag.description}</div>}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-[#00A99D]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Criar tag personalizada</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da tag"
                    value={customTagName}
                    onChange={(e) => setCustomTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddCustomTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomTag}
                    size="sm"
                    className="bg-[#00A99D] hover:bg-[#008a82]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTagObjects.length === 0 && (
        <p className="text-xs text-muted-foreground">Adicione tags para organizar e filtrar documentos facilmente</p>
      )}
    </div>
  )
}
