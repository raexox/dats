"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SearchInputProps {
  value: string
  onValueChange: (value: string) => void
  onSearch: (phrase: string) => void
  isLoading?: boolean
}

export function SearchInput({ value, onValueChange, onSearch, isLoading = false }: SearchInputProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Search any phrase (e.g., bananas, coffee, solar energy)"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading} className="gap-2">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  )
}
