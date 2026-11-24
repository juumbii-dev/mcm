"use server"

import { redirect } from "next/navigation"
import { getCurrentCMSAdmin } from "@/lib/admin-auth"
import { therapistAuth } from "@/lib/app-auth"
import { legacyAuthenticatedRequest } from "@/lib/legacy-api"

export type AdminDecisionState = {
  ok: boolean
  message: string
}

export type AdminPasswordState = {
  ok: boolean
  message: string
}

export type CreateAdminState = {
  ok: boolean
  message: string
}

export async function logoutAdmin() {
  await therapistAuth.logout()
  redirect("/admin-login")
}

export async function createAdminAccount(
  _previous: CreateAdminState | null,
  formData: FormData,
): Promise<CreateAdminState> {
  const admin = await getCurrentCMSAdmin()
  if (!admin) {
    return { ok: false, message: "Админ эрхээр дахин нэвтэрнэ үү." }
  }

  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  if (!name || !email) {
    return { ok: false, message: "Нэр болон имэйл шаардлагатай." }
  }
  if (password.length < 8 || password.length > 72) {
    return { ok: false, message: "Нууц үг 8-72 тэмдэгт байх шаардлагатай." }
  }

  try {
    await legacyAuthenticatedRequest("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        action: "createAdmin",
        name,
        email,
        password,
      }),
    })
    return { ok: true, message: "Шинэ admin account амжилттай үүслээ." }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Admin account үүсгэж чадсангүй.",
    }
  }
}

const decisions = new Set([
  "approve",
  "needs-info",
  "reject",
  "show",
  "hide",
])

export async function updateTherapistApplication(
  _previous: AdminDecisionState | null,
  formData: FormData,
): Promise<AdminDecisionState> {
  const admin = await getCurrentCMSAdmin()
  if (!admin) {
    return {
      ok: false,
      message: "Админ эрхээр дахин нэвтэрнэ үү.",
    }
  }

  const id = formData.get("id")
  const decision = formData.get("decision")
  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof decision !== "string" ||
    !decisions.has(decision)
  ) {
    return { ok: false, message: "Хүсэлт буруу байна." }
  }

  try {
    const status =
      decision === "approve"
        ? "approved"
        : decision === "needs-info"
          ? "needs-info"
          : decision === "reject"
            ? "rejected"
            : undefined
    await legacyAuthenticatedRequest("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        psychologistId: Number(id),
        status,
        isVisible:
          decision === "show"
            ? true
            : decision === "hide"
              ? false
              : status === "approved",
      }),
    })

    return {
      ok: true,
      message:
        decision === "approve"
          ? "Зөвлөхийг зөвшөөрч, сайтад идэвхжүүллээ."
          : "Төлөв амжилттай шинэчлэгдлээ.",
    }
  } catch {
    return {
      ok: false,
      message: "Өөрчлөлтийг хадгалж чадсангүй. Дахин оролдоно уу.",
    }
  }

}

export async function resetUserPassword(
  _previous: AdminPasswordState | null,
  formData: FormData,
): Promise<AdminPasswordState> {
  const admin = await getCurrentCMSAdmin()
  if (!admin) {
    return { ok: false, message: "Админ эрхээр дахин нэвтэрнэ үү." }
  }

  const id = Number(formData.get("id"))
  const newPassword = String(formData.get("newPassword") || "")
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: "Хэрэглэгчийн дугаар буруу байна." }
  }
  if (newPassword.length < 8 || newPassword.length > 72) {
    return {
      ok: false,
      message: "Нууц үг 8-72 тэмдэгт байх шаардлагатай.",
    }
  }

  try {
    await legacyAuthenticatedRequest("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        action: "changePassword",
        id,
        newPassword,
      }),
    })
    return { ok: true, message: "Нууц үг амжилттай шинэчлэгдлээ." }
  } catch {
    return {
      ok: false,
      message: "Нууц үгийг шинэчилж чадсангүй. Дахин оролдоно уу.",
    }
  }
}
