import "server-only"

import { cookies } from "next/headers"
import { legacyAuth, legacyRequest, normalizeLegacyUser, type LegacyUser } from "@/lib/legacy-api"

const SESSION_COOKIE = "app-session"

export function createAppAuth(appUserCollection: "users") {
  async function login(email: string, password: string) {
    const result = await legacyAuth("login", { email, password })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return result.user
  }

  async function currentUser(): Promise<LegacyUser | null> {
    const token = (await cookies()).get(SESSION_COOKIE)?.value
    if (!token) return null

    try {
      const result = await legacyRequest<{ user: Record<string, unknown> }>(
        "/auth",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      const user = normalizeLegacyUser(result.user)
      return user.accountType === "therapist" || appUserCollection === "users"
        ? user
        : null
    } catch {
      return null
    }
  }

  async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
  }

  return { login, currentUser, logout }
}

export const therapistAuth = createAppAuth("users")
