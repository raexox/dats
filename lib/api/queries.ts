import type { QueryHistoryItem, QueryRequest } from "@/types/api"

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")

  if (response.ok) {
    return isJson ? response.json() : response.text()
  }

  if (isJson) {
    const data = (await response.json()) as { message?: string; detail?: string }
    throw new Error(data.message || data.detail || `Request failed (${response.status}).`)
  }

  const message = await response.text()
  throw new Error(message || `Request failed (${response.status}).`)
}

export async function fetchRecentQueries(limit = 20): Promise<QueryHistoryItem[]> {
  const response = await fetch(`/api/queries?limit=${limit}`, { cache: "no-store" })
  return (await handleResponse(response)) as QueryHistoryItem[]
}

export async function saveQuery(request: QueryRequest): Promise<QueryHistoryItem> {
  const response = await fetch("/api/queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  return (await handleResponse(response)) as QueryHistoryItem
}
