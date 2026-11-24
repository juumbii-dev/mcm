"use client"

import { useActionState, useEffect, useRef } from "react"
import {
  resetUserPassword,
  type AdminPasswordState,
} from "@/app/(frontend)/admin-dashboard/actions"

export default function AdminPasswordReset({
  id,
}: {
  id: string | number
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useActionState<
    AdminPasswordState | null,
    FormData
  >(resetUserPassword, null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <input type="hidden" name="id" value={String(id)} />
      <input
        name="newPassword"
        type="password"
        minLength={8}
        maxLength={72}
        required
        placeholder="Шинэ нууц үг"
        className="rounded-full border border-[#d9c7b2] bg-white px-4 py-2 text-sm text-[#2d2620] outline-none focus:border-[#7a9e8e]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[#d9c7b2] px-4 py-2 text-xs font-bold text-[#6f543c] transition hover:bg-[#f7f3ee] disabled:opacity-50"
      >
        {pending ? "Хадгалж байна..." : "Нууц үг солих"}
      </button>
      {state && (
        <p
          role="status"
          className={`text-xs font-bold sm:pt-2 ${
            state.ok ? "text-[#55796a]" : "text-[#96533e]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
