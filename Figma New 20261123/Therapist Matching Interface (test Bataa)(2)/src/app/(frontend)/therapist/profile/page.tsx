import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { therapistAuth } from "@/lib/app-auth"
import { legacyRequest } from "@/lib/legacy-api"
import { logoutTherapist } from "../../therapist-signup/actions"

const statusMeta = {
  pending: {
    label: "Хянагдаж байна",
    detail:
      "Манай баг таны мэдээллийг шалгаж байна. Баталгаажсаны дараа профайл хайлтад харагдана.",
    classes: "border-[#e1d0ac] bg-[#fff8e7] text-[#795f2f]",
  },
  "needs-info": {
    label: "Нэмэлт мэдээлэл шаардлагатай",
    detail:
      "Профайлын зарим мэдээллийг нэмж баталгаажуулах шаардлагатай байна.",
    classes: "border-[#e8c8bb] bg-[#fff4ef] text-[#8d4e39]",
  },
  approved: {
    label: "Баталгаажсан",
    detail: "Таны профайл нийтэд харагдаж, цаг захиалга авахад бэлэн боллоо.",
    classes: "border-[#c6ddd2] bg-[#edf6f1] text-[#46675a]",
  },
  rejected: {
    label: "Татгалзсан",
    detail: "Бүртгэлийн мэдээлэл шаардлага хангаагүй байна.",
    classes: "border-[#e8c8bb] bg-[#fff4ef] text-[#8d4e39]",
  },
} as const

export default async function TherapistProfilePage() {
  const user = await therapistAuth.currentUser()
  if (!user) redirect("/therapist-login")

  if (!user.psychologistId) redirect("/therapist-signup")

  const profile = await legacyRequest<{
    id: number
    name: string
    specialty?: string | null
    focus?: string | null
    bio?: string | null
    experience?: number | null
    price?: number | null
    status?: keyof typeof statusMeta
    is_visible?: boolean
    photo?: string | null
    specializations?: string[]
    session_formats?: string[]
    calendly_url?: string | null
    meeting_provider?: string | null
  }>(`/psychologists/${user.psychologistId}`)

  const status = statusMeta[profile.status ?? "pending"] ?? statusMeta.pending
  const isPubliclyVisible =
    profile.status === "approved" && profile.is_visible !== false
  const photo = profile.photo ? { url: profile.photo, alt: profile.name } : null
  const format = profile.session_formats ?? []
  const specializations = profile.specializations ?? []
  const price = Number(profile.price ?? 0)
  const professionalTitle = profile.specialty ?? "Зөвлөх"
  const bio = profile.bio ?? profile.focus ?? ""

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-[#2d2620]">
      <header className="border-b border-[#e7ddd2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7d634a] text-lg text-white">
              S
            </span>
            <span className="font-display text-xl font-semibold">
              Сэтгэлзүйч
            </span>
          </Link>
          <form action={logoutTherapist}>
            <button
              type="submit"
              className="rounded-full border border-[#d9c7b2] px-4 py-2 text-sm font-bold text-[#6f543c] transition hover:bg-[#f7f3ee]"
            >
              Гарах
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-bold text-[#7d6f63] hover:text-[#55796a]"
        >
          ← Буцах
        </Link>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
              Зөвлөхийн dashboard
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">
              Таны профайл
            </h1>
            <p className="mt-2 text-sm text-[#7d6f63]">
              Сайн байна уу, {user.fullName}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/therapist/messages"
              className="text-sm font-bold text-[#55796a] hover:underline"
            >
              Чат inbox →
            </Link>
            <Link
              href="/"
              className="text-sm font-bold text-[#55796a] hover:underline"
            >
              Үйлчлүүлэгчийн харагдац руу очих
            </Link>
          </div>
        </div>

        <div
          className={`mb-6 rounded-3xl border p-5 ${status.classes}`}
          role="status"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <strong>{status.label}</strong>
            <span className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">
              Бүртгэлийн төлөв
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 opacity-90">
            {status.detail}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isPubliclyVisible ? "bg-[#4f8a72]" : "bg-[#b08a53]"
              }`}
            />
            {isPubliclyVisible
              ? "Сайтад идэвхтэй харагдаж байна"
              : "Сайтад одоогоор харагдахгүй байна"}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[28px] border border-[#e6dbcf] bg-white p-6 shadow-[0_20px_60px_rgba(74,58,45,0.06)] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {photo ? (
                <Image
                  src={photo.url ?? ""}
                  alt={photo.alt || profile.name}
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-[#7a9e8e] font-display text-3xl font-semibold text-white">
                  {profile.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-display text-3xl font-semibold">
                  {profile.name}
                </h2>
                <p className="mt-1 text-[#7d6f63]">
                  {professionalTitle}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {specializations.slice(0, 5).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#edf4f0] px-3 py-1.5 text-xs font-bold text-[#55796a]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-[#eee5dc] pt-7">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#8b6f52]">
                Танилцуулга
              </h3>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#51463d]">
                {bio}
              </p>
            </div>

          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#e6dbcf] bg-white p-6">
              <h3 className="font-display text-xl font-semibold">
                Үйлчилгээний мэдээлэл
              </h3>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-[#f0e8e0] pb-3">
                  <dt className="text-[#7d6f63]">Туршлага</dt>
                  <dd className="font-bold">{profile.experience} жил</dd>
                </div>
                {format.includes("online") && (
                  <>
                    <div className="flex justify-between gap-4 border-b border-[#f0e8e0] pb-3">
                      <dt className="text-[#7d6f63]">Онлайн уулзалт</dt>
                      <dd className="text-right font-bold">
                        {profile.meetingProvider
                          ? profile.meetingProvider === "zoom"
                            ? "Zoom"
                            : "Google Meet"
                          : "Тохируулаагүй"}
                      </dd>
                    </div>
                    <div className="border-b border-[#f0e8e0] pb-3">
                      <dt className="text-[#7d6f63]">Чатлах хуваарь</dt>
                      <dd className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-sm font-bold text-[#9a6b52]">
                          Admin-аас хуваариа нэмнэ үү
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-[#f0e8e0] pb-3">
                      <dt className="text-[#7d6f63]">Calendly</dt>
                      <dd className="max-w-[160px] truncate text-right font-bold">
                        {profile.calendly_url ? (
                          <a
                            href={profile.calendly_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#55796a] hover:underline"
                          >
                            Тохируулсан
                          </a>
                        ) : (
                          "Тохируулаагүй"
                        )}
                      </dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4 border-b border-[#f0e8e0] pb-3">
                  <dt className="text-[#7d6f63]">Үнэ</dt>
                  <dd className="font-bold">
                    {price.toLocaleString("mn-MN")}₮
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#f0e8e0] pb-3">
                  <dt className="text-[#7d6f63]">Хэлбэр</dt>
                  <dd className="text-right font-bold">
                    format
                      .map((item) => (item === "online" ? "Онлайн" : "Биечлэн"))
                      .join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#7d6f63]">Лиценз</dt>
                  <dd className="text-right font-bold">
                    Оруулаагүй
                  </dd>
                </div>
              </dl>
            </section>

            {profile.calendly_url && (
              <section className="overflow-hidden rounded-[28px] border border-[#d7e3dd] bg-white">
                <div className="bg-[#edf4f0] p-5">
                  <h3 className="font-display text-xl font-semibold text-[#354b42]">
                    Calendly цагийн харагдац
                  </h3>
                  <p className="mt-1 text-xs text-[#657b72]">
                    Үйлчлүүлэгчид харагдах боломжит цаг.
                  </p>
                </div>
                <iframe
                  title="Calendly боломжит цаг"
                  src={`${profile.calendly_url}${profile.calendly_url.includes("?") ? "&" : "?"}hide_gdpr_banner=1&background_color=fffdf9&text_color=2d2620&primary_color=55796a`}
                  className="h-[520px] w-full border-0"
                />
              </section>
            )}

            <section className="rounded-[28px] bg-[#735b45] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">
                Гишүүнчлэл
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                Эхний 6 сар үнэгүй
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Бүртгүүлснээс хойш 6 сарын турш төлбөргүй. 7 дахь сараас сарын
                10,000₮ байна.
              </p>
              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="text-sm font-bold">Танд нээлттэй боломжууд</p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {[
                    "Share office",
                    "Share meeting room",
                    "Сэтгэл зүйн тестийн сан",
                    "Шаардлагатай материал, нөөц",
                  ].map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <span className="text-[#c8dcd3]">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
