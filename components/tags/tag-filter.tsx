"use client"

import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PREDEFINED_TAGS, type Tag } from "@/types/tag"

interface TagFilterProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  availableTags?: Tag[]
}

export function TagFilter({ selectedTags, onTagsChange, availableTags = PREDEFINED_TAGS }: TagFilterProps) {
  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  const selectedTagObjects = availableTags.filter((tag) => selectedTags.includes(tag.id))

  return (
    <div className="flex items-center gap-2">
      {selectedTagObjects.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.color }}
          className="text-white cursor-pointer"
          onClick={() => handleToggleTag(tag.id)}
        >
          {tag.name}
        </Badge>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Filtrar por tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Filtrar por categoria</h4>
            <div className="grid gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`flex items-center justify-between p-2 rounded-md border transition-colors text-left ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-900/20 border-[#00A99D]"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-[#00A99D]" />}
                  </button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
