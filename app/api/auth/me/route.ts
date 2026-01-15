import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { BACKEND_BASE_URL } from "@/lib/api/backend"
import type { AuthUser } from "@/types/api"

const COOKIE_NAME = "dv_token"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      cookieStore.set(COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      })
      const errorText = await response.text()
      return NextResponse.json(
        { message: errorText || "Auth check failed." },
        { status: response.status }
      )
    }

    const user = (await response.json()) as AuthUser
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Auth check failed." },
      { status: 500 }
    )
  }
}
