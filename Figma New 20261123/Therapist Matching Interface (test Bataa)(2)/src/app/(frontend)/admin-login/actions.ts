"use server"

import { redirect } from "next/navigation"
import { therapistAuth } from "@/lib/app-auth"

export type AdminLoginState = {
  ok: boolean
  message?: string
}

export async function loginAdmin(
  _previous: AdminLoginState | null,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return { ok: false, message: "Имэйл болон нууц үгээ оруулна уу." }
  }

  try {
    const user = await therapistAuth.login(email, password)
    if (!user.isAdmin) {
      await therapistAuth.logout()
      return { ok: false, message: "Энэ account админ эрхгүй байна." }
    }
  } catch {
    return { ok: false, message: "Имэйл эсвэл нууц үг буруу байна." }
  }

  redirect("/admin-dashboard")
}
