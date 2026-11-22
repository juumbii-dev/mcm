"use server"

import { getPayloadClient } from "@/lib/payload"
import { getCurrentCMSAdmin } from "@/lib/admin-auth"

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
    const payload = await getPayloadClient()

    if (decision === "approve") {
      await payload.update({
        collection: "therapist-profiles",
        id,
        overrideAccess: false,
        user: admin,
        draft: false,
        data: { status: "approved", isVisible: true },
      })
    } else if (decision === "needs-info") {
      await payload.update({
        collection: "therapist-profiles",
        id,
        overrideAccess: false,
        user: admin,
        draft: false,
        data: { status: "needs-info", isVisible: false },
      })
    } else if (decision === "reject") {
      await payload.update({
        collection: "therapist-profiles",
        id,
        overrideAccess: false,
        user: admin,
        draft: false,
        data: { status: "rejected", isVisible: false },
      })
    } else {
      await payload.update({
        collection: "therapist-profiles",
        id,
        overrideAccess: false,
        user: admin,
        draft: false,
        data: { isVisible: decision === "show" },
      })
    }

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
