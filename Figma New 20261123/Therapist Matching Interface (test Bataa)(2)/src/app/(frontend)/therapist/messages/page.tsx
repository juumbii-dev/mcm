import Link from "next/link"
import { redirect } from "next/navigation"
import RealtimeInbox from "@/components/RealtimeInbox"
import { therapistAuth } from "@/lib/app-auth"

export default async function TherapistMessagesPage() {
  const user = await therapistAuth.currentUser()
  if (!user || user.accountType !== "therapist") {
    redirect("/therapist-login")
  }

  if (!user.psychologistId) redirect("/therapist/profile")

  return (
    <div className="min-h-screen bg-[#f8f4ef] px-5 py-8 text-[#2d2620]">
      <main className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/therapist/profile"
            className="text-sm font-bold text-[#7d6f63]"
          >
            ← Профайл руу буцах
          </Link>
          <Link href="/" className="text-sm font-bold text-[#55796a]">
            Нүүр рүү
          </Link>
        </div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
          Supabase Realtime inbox
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">
          Үйлчлүүлэгчийн чатууд
        </h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-[#7d6f63]">
          Нэвтрэхгүйгээр эхлүүлсэн зочин чатууд энд ирнэ. Нууц эмнэлгийн
          мэдээлэл солилцохгүй байхыг анхаарна уу.
        </p>
        <RealtimeInbox therapistId={String(user.psychologistId)} />
      </main>
    </div>
  )
}
