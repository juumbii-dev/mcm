"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import {
  loginTherapist,
  type SignupResult,
} from "@/app/(frontend)/therapist-signup/actions"

export default function TherapistLoginForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState<SignupResult | null, FormData>(
    loginTherapist,
    null,
  )

  useEffect(() => {
    if (state?.ok) {
      router.push("/therapist/profile")
      router.refresh()
    }
  }, [router, state])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef] px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[#e6dbcf] bg-white p-7 shadow-[0_24px_80px_rgba(74,58,45,0.09)] sm:p-10">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-bold text-[#7d6f63] hover:text-[#55796a]"
        >
          ← Буцах
        </Link>
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7d634a] text-lg text-white">
            S
          </span>
          <span className="font-display text-xl font-semibold">Сэтгэлзүйч</span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
          Зөвлөхийн хэсэг
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Профайлдаа нэвтрэх
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#7d6f63]">
          Бүртгэлийн явц, нийтэд харагдах мэдээллээ нэг дор удирдана.
        </p>

        <form action={action} className="mt-7 space-y-5">
          <Field label="Имэйл хаяг">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label="Нууц үг">
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>
          {state && !state.ok && (
            <p
              role="alert"
              className="rounded-2xl bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[#8d4e39]"
            >
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[#55796a] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#46675a] disabled:opacity-60"
          >
            {pending ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7d6f63]">
          Зөвлөхийн бүртгэлгүй юу?{" "}
          <Link
            href="/therapist-signup"
            className="font-bold text-[#55796a] hover:underline"
          >
            Бүртгүүлэх
          </Link>
        </p>
        <div className="mt-5 border-t border-[#eee5dc] pt-5 text-center">
          <Link
            href="/admin-dashboard"
            className="text-sm font-bold text-[#8b6f52] hover:underline"
          >
            Админ нэвтрэх хэсэг
          </Link>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#3d332b]">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  "w-full rounded-2xl border border-[#ded3c6] bg-white px-4 py-3.5 text-[15px] outline-none transition focus:border-[#7a9e8e] focus:ring-4 focus:ring-[#7a9e8e]/10"
