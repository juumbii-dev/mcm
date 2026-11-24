import "server-only"

import { cookies } from "next/headers"

const legacyApiURL = (process.env.LEGACY_API_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
)

export type LegacyUser = {
  id: number
  name: string
  fullName: string
  email: string
  role: string
  accountType: "client" | "therapist"
  isAdmin: boolean
  isActive: boolean
  psychologistId?: number | null
  [key: string]: unknown
}

function normalizeUser(value: Record<string, unknown>): LegacyUser {
  const role = String(value.role || "client")
  return {
    ...value,
    id: Number(value.id),
    name: String(value.name || value.fullName || ""),
    fullName: String(value.fullName || value.name || ""),
    email: String(value.email || ""),
    role,
    accountType: role === "counselor" ? "therapist" : "client",
    isAdmin: value.isAdmin === true || value.is_admin === true,
    isActive: value.isActive !== false && value.is_active !== false,
    psychologistId:
      value.psychologistId === undefined
        ? (value.psychologist_id as number | null | undefined)
        : (value.psychologistId as number | null | undefined),
  }
}

export async function legacyRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${legacyApiURL}/api${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Legacy API returned ${response.status}`
    throw new Error(message)
  }

  return body as T
}

export async function legacyAuth(
  action: "login" | "register",
  data: Record<string, unknown>,
) {
  const result = await legacyRequest<{
    user: Record<string, unknown>
    token: string
  }>("/auth", {
    method: "POST",
    body: JSON.stringify({ action, ...data }),
  })

  return {
    user: normalizeUser(result.user),
    token: result.token,
  }
}

export async function legacyAuthenticatedRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get("app-session")?.value
  if (!token) throw new Error("Нэвтрэх шаардлагатай.")

  return legacyRequest<T>(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
}

export function normalizeLegacyUser(value: Record<string, unknown>) {
  return normalizeUser(value)
}
