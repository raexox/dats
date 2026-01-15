export type HealthResponse = {
  status: string
  time: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "")

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  return response.json()
}
