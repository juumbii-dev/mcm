"use client"

import Link from "next/link"
import { useActionState } from "react"
import {
  loginAdmin,
  type AdminLoginState,
} from "./actions"

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<
    AdminLoginState | null,
    FormData
  >(loginAdmin, null)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef] px-5 py-12 text-[#2d2620]">
      <section className="w-full max-w-md rounded-[28px] border border-[#e6dbcf] bg-white p-8 shadow-[0_24px_80px_rgba(74,58,45,0.09)] sm:p-10">
        <Link
          href="/"
          className="text-sm font-bold text-[#7d6f63] hover:text-[#55796a]"
        >
          ← Буцах
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
          Admin
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">
          Админ нэвтрэлт
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#7d6f63]">
          Зөвлөхийн хүсэлт болон public profile-ийн төлвийг удирдана.
        </p>

        <form action={action} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Имэйл</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-[#ded3c6] px-4 py-3.5 outline-none focus:border-[#7a9e8e] focus:ring-4 focus:ring-[#7a9e8e]/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Нууц үг</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[#ded3c6] px-4 py-3.5 outline-none focus:border-[#7a9e8e] focus:ring-4 focus:ring-[#7a9e8e]/10"
            />
          </label>
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
            {pending ? "Нэвтэрч байна..." : "Админаар нэвтрэх"}
          </button>
        </form>
      </section>
    </main>
  )
}
