"use server"

import { getCurrentCMSAdmin } from "@/lib/admin-auth"
import { legacyAuthenticatedRequest } from "@/lib/legacy-api"

export type AdminDecisionState = {
  ok: boolean
  message: string
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
