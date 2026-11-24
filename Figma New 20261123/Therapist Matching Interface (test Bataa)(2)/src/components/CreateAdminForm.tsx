"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  createAdminAccount,
  type CreateAdminState,
} from "@/app/(frontend)/admin-dashboard/actions"

export default function CreateAdminForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useActionState<
    CreateAdminState | null,
    FormData
  >(createAdminAccount, null)

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [router, state])

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
    >
      <label className="text-sm font-semibold text-[#5f5349]">
        Нэр
        <input
          name="name"
          required
          className="mt-1 w-full rounded-2xl border border-[#d9c7b2] bg-white px-4 py-2.5 font-normal outline-none focus:border-[#7a9e8e]"
        />
      </label>
      <label className="text-sm font-semibold text-[#5f5349]">
        Имэйл
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-2xl border border-[#d9c7b2] bg-white px-4 py-2.5 font-normal outline-none focus:border-[#7a9e8e]"
        />
      </label>
      <label className="text-sm font-semibold text-[#5f5349]">
        Нууц үг
        <input
          name="password"
          type="password"
          minLength={8}
          maxLength={72}
          required
          className="mt-1 w-full rounded-2xl border border-[#d9c7b2] bg-white px-4 py-2.5 font-normal outline-none focus:border-[#7a9e8e]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#55796a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#46675a] disabled:opacity-50"
      >
        {pending ? "Үүсгэж байна..." : "Admin үүсгэх"}
      </button>
      {state && (
        <p
          role="status"
          className={`text-xs font-bold md:col-span-4 ${
            state.ok ? "text-[#55796a]" : "text-[#96533e]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
