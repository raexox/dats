"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SearchInputProps {
  onSearch: (phrase: string) => void
  isLoading?: boolean
}

export function SearchInput({ onSearch, isLoading = false }: SearchInputProps) {
  const [phrase, setPhrase] = useState("bananas")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(phrase)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Search any phrase (e.g., bananas, coffee, solar energy)"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
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
