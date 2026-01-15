import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { BACKEND_BASE_URL } from "@/lib/api/backend"

const COOKIE_NAME = "dv_token"

function getTokenFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore.get(COOKIE_NAME)?.value
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = getTokenFromCookies(cookieStore)
    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const payload = await request.json()
    const response = await fetch(`${BACKEND_BASE_URL}/queries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { message: errorText || "Failed to save query." },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save query." },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = getTokenFromCookies(cookieStore)
    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ?? "20"
    const response = await fetch(`${BACKEND_BASE_URL}/queries?limit=${encodeURIComponent(limit)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { message: errorText || "Failed to load queries." },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load queries." },
      { status: 500 }
    )
  }
}
