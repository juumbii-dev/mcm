"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import {
  updateTherapistApplication,
  type AdminDecisionState,
} from "@/app/(frontend)/admin-dashboard/actions"

export default function AdminApplicationActions({
  id,
  status,
  isVisible,
}: {
  id: string | number
  status: string
  isVisible?: boolean | null
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState<
    AdminDecisionState | null,
    FormData
  >(updateTherapistApplication, null)

  useEffect(() => {
    if (state?.ok) router.refresh()
  }, [router, state])

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="id" value={String(id)} />
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <button
            type="submit"
            name="decision"
            value="approve"
            disabled={pending}
            className="rounded-full bg-[#55796a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#46675a] disabled:opacity-50"
          >
            Зөвшөөрөх
          </button>
        )}
        <button
          type="submit"
          name="decision"
          value="needs-info"
          disabled={pending}
          className="rounded-full border border-[#d9c7b2] px-4 py-2 text-xs font-bold text-[#6f543c] transition hover:bg-[#f7f3ee] disabled:opacity-50"
        >
          Мэдээлэл нэхэх
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="rounded-full border border-[#e0c3b8] px-4 py-2 text-xs font-bold text-[#96533e] transition hover:bg-[#fff4ef] disabled:opacity-50"
        >
          Татгалзах
        </button>
        {status === "approved" && (
          <button
            type="submit"
            name="decision"
            value={isVisible === false ? "show" : "hide"}
            disabled={pending}
            className="rounded-full bg-[#2d2620] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#493e35] disabled:opacity-50"
          >
            {isVisible === false ? "Сайтад харуулах" : "Сайтаас нуух"}
          </button>
        )}
      </div>
      {state && (
        <p
          role="status"
          className={`mt-3 text-xs font-bold ${
            state.ok ? "text-[#55796a]" : "text-[#96533e]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
