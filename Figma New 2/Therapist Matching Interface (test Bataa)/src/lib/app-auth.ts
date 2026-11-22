import "server-only"

import config from "@payload-config"
import { cookies } from "next/headers"
import { getPayload } from "payload"

const SESSION_COOKIE = "app-session"

export function createAppAuth(appUserCollection: "users") {
  async function login(email: string, password: string) {
    const payload = await getPayload({ config })
    const result = await payload.login({
      collection: appUserCollection,
      data: { email, password },
      overrideAccess: false,
    })

    if (!result.token || !result.user) {
      throw new Error("Нэвтрэх мэдээлэл буруу байна.")
    }

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

  async function currentUser() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value
    if (!token) return null

    const payload = await getPayload({ config })
    const authHeaders = new Headers({ Authorization: `JWT ${token}` })
    const { user } = await payload.auth({ headers: authHeaders })
    if (!user || user.collection !== appUserCollection) return null
    return user
  }

  async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
  }

  return { login, currentUser, logout }
}

export const therapistAuth = createAppAuth("users")
