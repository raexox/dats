"use client"

import { useEffect, useState } from "react"
import type { AuthUser } from "@/types/api"
import { getMe } from "@/lib/api/auth"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const me = await getMe()
      setUser(me)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : "Unable to load user.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const handler = () => {
      refresh()
    }
    window.addEventListener("auth:changed", handler)
    return () => window.removeEventListener("auth:changed", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, isLoading, error, refresh }
}
