import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { BACKEND_BASE_URL } from "@/lib/api/backend"
import type { AuthLoginRequest, AuthUser } from "@/types/api"

const COOKIE_NAME = "dv_token"

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AuthLoginRequest

    const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { message: errorText || "Login failed." },
        { status: response.status }
      )
    }

    const data = (await response.json()) as { access_token: string; user: AuthUser }
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Number(process.env.JWT_EXPIRES_MINUTES ?? "120") * 60,
    })

    return NextResponse.json(data.user)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Login failed." },
      { status: 500 }
    )
  }
}
