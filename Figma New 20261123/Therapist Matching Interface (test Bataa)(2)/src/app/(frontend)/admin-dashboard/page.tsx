import Link from "next/link"
import AdminApplicationActions from "@/components/AdminApplicationActions"
import AdminPasswordReset from "@/components/AdminPasswordReset"
import CreateAdminForm from "@/components/CreateAdminForm"
import { logoutAdmin } from "./actions"
import { getCurrentCMSAdmin } from "@/lib/admin-auth"
import { legacyAuthenticatedRequest } from "@/lib/legacy-api"

const statusLabels: Record<string, string> = {
  pending: "Хянагдаж байна",
  "needs-info": "Мэдээлэл шаардлагатай",
  approved: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentCMSAdmin()

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef] px-5 py-12">
        <section className="w-full max-w-lg rounded-[28px] border border-[#e6dbcf] bg-white p-8 shadow-[0_24px_80px_rgba(74,58,45,0.09)] sm:p-10">
          <Link
            href="/"
            className="text-sm font-bold text-[#7d6f63] hover:text-[#55796a]"
          >
            ← Буцах
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
            Админ хэсэг
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            Зөвлөхийн хүсэлтүүд
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#7d6f63]">
            Админ нэвтрэлт нь одоогийн application authentication системээр
            ажиллана. Нэвтэрсний дараа энэ хуудас руу буцаж ирж хүсэлтүүдийг
            зөвшөөрнө үү.
          </p>
          <Link
            href="/admin-login"
            className="mt-7 block rounded-full bg-[#55796a] px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#46675a]"
          >
            Админ системд нэвтрэх
          </Link>
          <Link
            href="/admin-dashboard"
            className="mt-3 block rounded-full border border-[#d9c7b2] px-6 py-3 text-center text-sm font-bold text-[#6f543c] transition hover:bg-[#f7f3ee]"
          >
            Нэвтэрсний дараа үргэлжлүүлэх
          </Link>
        </section>
      </main>
    )
  }

  const result = await legacyAuthenticatedRequest<{
    users: Array<Record<string, unknown>>
    counselors: Array<Record<string, unknown>>
  }>("/admin/users")
  const adminUsers = result.users.filter(
    (user) => user.role === "admin" || user.isAdmin === true,
  )
  const allUsers = result.users
  const applications = result.counselors.map((counselor) => ({
    ...counselor,
    status: String(counselor.status || "pending"),
    isVisible: counselor.isVisible !== false,
    professionalTitle: String(counselor.specialty || "Зөвлөх"),
    format: Array.isArray(counselor.session_formats)
      ? counselor.session_formats
      : [],
    calendlyURL: counselor.calendly_url as string | null,
    meetingProvider: counselor.meeting_provider as string | null,
    bio: String(counselor.bio || counselor.focus || ""),
    experience: Number(counselor.experience || 0),
    owner: null,
  }))
  const pendingCount = applications.filter(
    (profile) => profile.status === "pending",
  ).length
  const activeCount = applications.filter(
    (profile) =>
      profile.status === "approved" && profile.isVisible !== false,
  ).length

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
          <form action={logoutAdmin}>
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
          className="inline-flex text-sm font-bold text-[#7d6f63] hover:text-[#55796a]"
        >
          ← Буцах
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
              Админ dashboard
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">
              Зөвлөхийн хүсэлтүүд
            </h1>
            <p className="mt-2 text-sm text-[#7d6f63]">
              {admin.email} эрхээр нэвтэрсэн
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            ["Нийт хүсэлт", applications.length],
            ["Хүлээгдэж буй", pendingCount],
            ["Сайтад идэвхтэй", activeCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-[#e6dbcf] bg-white p-5"
            >
              <p className="text-sm text-[#7d6f63]">{label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-3xl border border-[#e6dbcf] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
                Системийн эрх
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Admin хэрэглэгчид
              </h2>
            </div>
            <span className="rounded-full bg-[#edf6f1] px-3 py-1 text-xs font-bold text-[#46675a]">
              {adminUsers.length}
            </span>
          </div>
          <div className="mt-4 divide-y divide-[#eee5dc]">
            {adminUsers.length === 0 ? (
              <p className="py-4 text-sm text-[#7d6f63]">
                Admin хэрэглэгч бүртгэгдээгүй байна.
              </p>
            ) : (
              adminUsers.map((user) => (
                <div
                  key={String(user.id)}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#2d2620]">
                      {String(user.name || "Нэр оруулаагүй")}
                    </p>
                    <p className="text-sm text-[#7d6f63]">
                      {String(user.email || "Имэйл оруулаагүй")}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#46675a]">
                    {user.isActive === false ? "Идэвхгүй" : "Идэвхтэй"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#e6dbcf] bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
            Системийн эрх
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Шинэ admin account үүсгэх
          </h2>
          <p className="mt-2 text-sm text-[#7d6f63]">
            Admin dashboard-д нэвтрэх эрхтэй шинэ хэрэглэгч үүсгэнэ.
          </p>
          <CreateAdminForm />
        </section>

        <section className="mt-8 rounded-3xl border border-[#e6dbcf] bg-white p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
              Хэрэглэгчийн удирдлага
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Бүх хэрэглэгчийн нууц үг
            </h2>
            <p className="mt-2 text-sm text-[#7d6f63]">
              Admin, зөвлөх болон үйлчлүүлэгчийн нууц үгийг тус бүрээр нь шинэчилнэ.
            </p>
          </div>
          <div className="mt-4 divide-y divide-[#eee5dc]">
            {allUsers.length === 0 ? (
              <p className="py-4 text-sm text-[#7d6f63]">
                Хэрэглэгч бүртгэгдээгүй байна.
              </p>
            ) : (
              allUsers.map((user) => (
                <div
                  key={String(user.id)}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#2d2620]">
                      {String(user.name || "Нэр оруулаагүй")}
                    </p>
                    <p className="text-sm text-[#7d6f63]">
                      {String(user.email || "Имэйл оруулаагүй")} ·{" "}
                      {user.role === "admin"
                        ? "Admin"
                        : user.role === "counselor"
                          ? "Зөвлөх"
                          : "Үйлчлүүлэгч"}
                    </p>
                  </div>
                  <AdminPasswordReset id={String(user.id)} />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9c7b2] bg-white p-10 text-center text-[#7d6f63]">
              Одоогоор зөвлөхийн хүсэлт ирээгүй байна.
            </div>
          ) : (
            applications.map((profile) => {
              const owner =
                typeof profile.owner === "object" ? profile.owner : null

              return (
                <article
                  key={profile.id}
                  className="rounded-[28px] border border-[#e6dbcf] bg-white p-6 shadow-[0_16px_50px_rgba(74,58,45,0.05)]"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl font-semibold">
                          {profile.name}
                        </h2>
                        <span className="rounded-full bg-[#f2ece5] px-3 py-1 text-xs font-bold text-[#705f50]">
                          {statusLabels[profile.status] ?? profile.status}
                        </span>
                        {profile.status === "approved" && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              profile.isVisible === false
                                ? "bg-[#fff4ef] text-[#96533e]"
                                : "bg-[#edf6f1] text-[#46675a]"
                            }`}
                          >
                            {profile.isVisible === false
                              ? "Сайтаас нуусан"
                              : "Сайтад идэвхтэй"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#7d6f63]">
                        {profile.professionalTitle} · {profile.experience} жил
                      </p>
                      <div className="mt-4 grid gap-2 text-sm text-[#5f5349] sm:grid-cols-2">
                        <p>
                          <strong>Имэйл:</strong>{" "}
                          {owner?.email || "Эзэмшигч холбогдоогүй"}
                        </p>
                        <p>
                          <strong>Үйлчилгээ:</strong>{" "}
                          {(profile.format ?? [])
                            .map((item) =>
                              item === "online" ? "Онлайн" : "Биечлэн",
                            )
                            .join(", ")}
                        </p>
                        <p>
                          <strong>Calendly:</strong>{" "}
                          {profile.calendlyURL ? "Тохируулсан" : "Тохируулаагүй"}
                        </p>
                        <p>
                          <strong>Уулзалт:</strong>{" "}
                          {profile.meetingProvider
                            ? profile.meetingProvider === "zoom"
                              ? "Zoom"
                              : "Google Meet"
                            : "Тохируулаагүй"}
                        </p>
                      </div>
                      <p className="mt-4 line-clamp-2 max-w-3xl text-sm leading-6 text-[#6c5f54]">
                        {profile.bio}
                      </p>
                    </div>
                  </div>
                  <AdminApplicationActions
                    id={profile.id}
                    status={profile.status}
                    isVisible={profile.isVisible}
                  />
                </article>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}
