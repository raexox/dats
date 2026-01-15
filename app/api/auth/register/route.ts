import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { BACKEND_BASE_URL } from "@/lib/api/backend"
import type { AuthRegisterRequest, AuthUser, AuthLoginRequest } from "@/types/api"

const COOKIE_NAME = "dv_token"

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AuthRegisterRequest

    const registerResponse = await fetch(`${BACKEND_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text()
      return NextResponse.json(
        { message: errorText || "Registration failed." },
        { status: registerResponse.status }
      )
    }

    const loginPayload: AuthLoginRequest = { email: payload.email, password: payload.password }
    const loginResponse = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
    })

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      return NextResponse.json(
        { message: errorText || "Login failed." },
        { status: loginResponse.status }
      )
    }

    const loginData = (await loginResponse.json()) as { access_token: string; user: AuthUser }
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, loginData.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Number(process.env.JWT_EXPIRES_MINUTES ?? "120") * 60,
    })

    return NextResponse.json(loginData.user)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 }
    )
  }
}
