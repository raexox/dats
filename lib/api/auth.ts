import type { AuthLoginRequest, AuthRegisterRequest, AuthUser } from "@/types/api"

function notifyAuthChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("auth:changed"))
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")

  if (response.ok) {
    return isJson ? response.json() : response.text()
  }

  if (isJson) {
    const data = (await response.json()) as { message?: string; detail?: string }
    throw new Error(data.message || data.detail || `Auth request failed (${response.status}).`)
  }

  const message = await response.text()
  throw new Error(message || `Auth request failed (${response.status}).`)
}

export async function register(payload: AuthRegisterRequest): Promise<AuthUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = (await handleResponse(response)) as AuthUser
  notifyAuthChanged()
  return data
}

export async function login(payload: AuthLoginRequest): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = (await handleResponse(response)) as AuthUser
  notifyAuthChanged()
  return data
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" })
  await handleResponse(response)
  notifyAuthChanged()
}

export async function getMe(): Promise<AuthUser> {
  const response = await fetch("/api/auth/me", { cache: "no-store" })
  return (await handleResponse(response)) as AuthUser
}
