"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { createGuestConversation } from "@/lib/supabase-chat"

const PAYMENT_ACCOUNT_NUMBER = "290005005026909442"
const SOCIALPAY_NUMBER = "89880034"

export type AvailabilitySlot = {
  day: string
  startTime: string
  endTime: string
}

export type ChatTherapist = {
  id: string
  name: string
  professionalTitle: string
  bio: string
  approach?: string
  photo?: { url: string; alt: string }
  experience: number
  price: number
  sessionLength: number
  gender?: string
  format: string[]
  categories: string[]
  specializations: string[]
  languages: string[]
  location?: { aimag?: string; district?: string; address?: string }
  education: { school: string; degree: string }[]
  calendlyURL?: string
  meetingProvider?: string
  chatAvailability: AvailabilitySlot[]
}

const days = [
  ["monday", "Даваа"],
  ["tuesday", "Мягмар"],
  ["wednesday", "Лхагва"],
  ["thursday", "Пүрэв"],
  ["friday", "Баасан"],
  ["saturday", "Бямба"],
  ["sunday", "Ням"],
] as const

const dayLabel = (value: string) =>
  days.find(([day]) => day === value)?.[1] || value

function calendlyEmbed(url: string) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set("hide_gdpr_banner", "1")
    parsed.searchParams.set("background_color", "fffdf9")
    parsed.searchParams.set("text_color", "2d2620")
    parsed.searchParams.set("primary_color", "55796a")
    return parsed.toString()
  } catch {
    return url
  }
}

function TherapistDetail({
  therapist,
  onClose,
  onChat,
  pending,
  initialCalendarOpen,
}: {
  therapist: ChatTherapist
  onClose: () => void
  onChat: () => void
  pending: boolean
  initialCalendarOpen: boolean
}) {
  const [tab, setTab] = useState("about")
  const [showCalendar, setShowCalendar] = useState(initialCalendarOpen)
  const [showPayment, setShowPayment] = useState(false)
  const location = [therapist.location?.district, therapist.location?.aimag]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#2d2620]/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${therapist.name} дэлгэрэнгүй`}
    >
      <div className="mx-auto min-h-full max-w-5xl rounded-[30px] bg-[#fffdf9] shadow-[0_30px_100px_rgba(38,31,25,0.25)]">
        <div className="flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ded3c6] bg-white text-xl text-[#6b5c50]"
            aria-label="Хаах"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-10 sm:px-10 lg:px-14">
          <section className="grid gap-8 lg:grid-cols-[230px_1fr] lg:items-center">
            <div className="mx-auto">
              {therapist.photo ? (
                <div className="rounded-full border-2 border-[#70c4cb] p-1.5">
                  <Image
                    src={therapist.photo.url}
                    alt={therapist.photo.alt}
                    width={210}
                    height={210}
                    className="h-48 w-48 rounded-full object-cover sm:h-52 sm:w-52"
                  />
                </div>
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-full border-2 border-[#70c4cb] bg-[#dfece6] font-display text-5xl text-[#55796a]">
                  {therapist.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  {therapist.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff3ec] px-3 py-1 text-xs font-extrabold text-[#39705d]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#4e9279] text-[10px] text-white">
                    ✓
                  </span>
                  Баталгаажсан
                </span>
              </div>
              <p className="mt-3 text-lg font-bold text-[#65594f]">
                {therapist.professionalTitle}
              </p>
              <p className="mt-1 text-sm text-[#8b7b6e]">
                {therapist.gender === "male" ? "Тэр / Түүний" : "Тэр / Түүний"} ·{" "}
                {therapist.experience} жилийн туршлага
              </p>
              {location && (
                <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#55796a] lg:justify-start">
                  <span aria-hidden="true">⌖</span>
                  {location}
                </p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                {therapist.specializations.slice(0, 4).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#dacfc4] bg-white px-3 py-1.5 text-xs font-bold text-[#65594f]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-9 grid gap-4 rounded-[24px] border border-[#e5d9ce] bg-[#f7f2ec] p-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8b7b6e]">
                Чатлах боломжтой
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {therapist.chatAvailability.length ? (
                  therapist.chatAvailability.slice(0, 4).map((slot, index) => (
                    <span
                      key={`${slot.day}-${index}`}
                      className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#46675a] shadow-sm"
                    >
                      {dayLabel(slot.day)} {slot.startTime}–{slot.endTime}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#7d6f63]">
                    Чатаар цаг тохиролцоно
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8b7b6e]">
                Уулзалтын үнэ
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {therapist.price.toLocaleString("mn-MN")}₮
              </p>
              <p className="text-xs text-[#7d6f63]">
                {therapist.sessionLength} минут
              </p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8b7b6e]">
                Хэлбэр
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {therapist.format.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#e3eee9] px-3 py-1.5 text-xs font-bold text-[#46675a]"
                  >
                    {item === "online" ? "Онлайн" : "Биечлэн"}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <nav className="mt-9 flex gap-6 overflow-x-auto border-b border-[#e4d8cd]">
            {[
              ["about", "Танилцуулга"],
              ["specialties", "Мэргэшил"],
              ["locations", "Байршил"],
              ["fees", "Үнэ, төлбөр"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-extrabold ${
                  tab === value
                    ? "border-[#55796a] text-[#46675a]"
                    : "border-transparent text-[#8b7b6e]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="min-h-44 py-7 text-[15px] leading-7 text-[#5f534a]">
            {tab === "about" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#2d2620]">
                    Миний тухай
                  </h3>
                  <p className="mt-3 whitespace-pre-line">{therapist.bio}</p>
                  {therapist.approach && (
                    <>
                      <h3 className="mt-6 font-display text-xl font-semibold text-[#2d2620]">
                        Ажиллах арга барил
                      </h3>
                      <p className="mt-2 whitespace-pre-line">
                        {therapist.approach}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-2xl bg-[#edf4f0] p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#55796a]">
                    Боловсрол
                  </p>
                  {therapist.education.map((item, index) => (
                    <div key={`${item.school}-${index}`} className="mt-3">
                      <p className="font-bold text-[#354b42]">{item.degree}</p>
                      <p className="text-sm">{item.school}</p>
                    </div>
                  ))}
                  {!!therapist.languages.length && (
                    <p className="mt-5 text-sm">
                      <strong>Хэл:</strong> {therapist.languages.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
            {tab === "specialties" && (
              <div className="flex flex-wrap gap-3">
                {therapist.specializations.map((item) => (
                  <span
                    key={item}
                    className="rounded-2xl border border-[#d8e4de] bg-[#f2f7f4] px-4 py-3 font-bold text-[#46675a]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
            {tab === "locations" && (
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#2d2620]">
                  Үйлчилгээний байршил
                </h3>
                <p className="mt-3">
                  {therapist.location?.address ||
                    location ||
                    "Онлайн уулзалтаар Монголын хаанаас ч холбогдоно."}
                </p>
                {therapist.format.includes("online") && (
                  <p className="mt-3 font-bold text-[#55796a]">
                    Онлайн ·{" "}
                    {therapist.meetingProvider === "zoom"
                      ? "Zoom"
                      : "Google Meet"}
                  </p>
                )}
              </div>
            )}
            {tab === "fees" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#e4d8cd] bg-white p-5">
                  <p className="text-sm text-[#7d6f63]">Нэг удаагийн уулзалт</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-[#2d2620]">
                    {therapist.price.toLocaleString("mn-MN")}₮
                  </p>
                  <p className="text-sm">{therapist.sessionLength} минут</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayment(true)}
                  className="group rounded-2xl bg-[#735b45] p-5 text-left text-white transition hover:bg-[#654d39] focus:outline-none focus:ring-4 focus:ring-[#735b45]/20"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-bold">Төлбөрийн сонголт</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
                      →
                    </span>
                  </span>
                  <p className="mt-2 text-sm text-white/75">
                    QPay, SocialPay болон дансны QR-аар төлөх боломжтой.
                  </p>
                  <span className="mt-4 block text-xs font-extrabold uppercase tracking-[0.12em] text-white/70">
                    Мэдээлэл харах
                  </span>
                </button>
              </div>
            )}
          </div>

          {showPayment && (
            <div
              className="fixed inset-0 z-[70] overflow-y-auto bg-[#2d2620]/60 p-3 backdrop-blur-sm sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Төлбөрийн сонголт"
            >
              <div className="mx-auto my-4 max-w-3xl overflow-hidden rounded-[30px] bg-[#fffdf9] shadow-[0_30px_100px_rgba(38,31,25,0.35)] sm:my-8">
                <div className="flex items-start justify-between gap-5 border-b border-[#e8ddd3] px-5 py-5 sm:px-8">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#7a9e8e]">
                      Төлбөр төлөх
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-semibold">
                      Төлбөрийн сонголт
                    </h3>
                    <p className="mt-1 text-sm text-[#7d6f63]">
                      {therapist.name} · {therapist.sessionLength} минут
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPayment(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ded3c6] bg-white text-xl text-[#6b5c50]"
                    aria-label="Төлбөрийн цонх хаах"
                  >
                    ×
                  </button>
                </div>

                <div className="p-5 sm:p-8">
                  <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#f0e8df] px-5 py-4">
                    <span className="text-sm font-bold text-[#5f534a]">
                      Нийт төлөх дүн
                    </span>
                    <span className="font-display text-2xl font-semibold text-[#735b45]">
                      {therapist.price.toLocaleString("mn-MN")}₮
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="rounded-[24px] border-2 border-[#d9c7b2] bg-[#f7f3ee] p-5 text-center">
                      <p className="text-left text-sm font-extrabold text-[#2d2620]">
                        Дансны QR
                      </p>
                      <div className="mx-auto my-4 w-fit rounded-2xl bg-white p-4 shadow-sm">
                        <QRCodeSVG
                          value={PAYMENT_ACCOUNT_NUMBER}
                          size={176}
                          level="H"
                          bgColor="#ffffff"
                          fgColor="#2d2620"
                          title={`Дансны дугаар ${PAYMENT_ACCOUNT_NUMBER}`}
                        />
                      </div>
                      <p className="text-xs text-[#8a7968]">
                        Банкны апп-аар уншуулна уу
                      </p>
                    </section>

                    <div className="grid gap-4">
                      <section className="rounded-[24px] border border-[#e2d6ca] bg-white p-5">
                        <div className="flex items-start gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#735b45] text-sm font-extrabold text-white">
                            Банк
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a7968]">
                              Дансны дугаар
                            </p>
                            <p className="mt-1 break-all text-base font-extrabold tracking-wide text-[#2d2620]">
                              {PAYMENT_ACCOUNT_NUMBER}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-[#8a7968]">
                              Гүйлгээний утгад захиалгын нэр, утасны дугаараа
                              бичнэ үү.
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[24px] border border-[#cddfd7] bg-[#edf4f0] p-5">
                        <div className="flex items-center gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7a9e8e] text-sm font-extrabold text-white">
                            SP
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#657b72]">
                              SocialPay дугаар
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-wider text-[#55796a]">
                              {SOCIALPAY_NUMBER}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-[#657b72]">
                          SocialPay апп-аас дээрх дугаар руу шилжүүлнэ үү.
                        </p>
                      </section>
                    </div>

                    <section className="rounded-[24px] border border-[#e2d6ca] bg-white p-5 sm:col-span-2">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b6f52] text-sm font-extrabold text-white">
                            QP
                          </span>
                          <div>
                            <p className="font-extrabold">QPay</p>
                            <p className="text-xs text-[#8a7968]">
                              QPay дэмждэг банкны апп-аар дансны QR-ийг уншуулна.
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#f0e8df] px-4 py-2 text-xs font-bold text-[#735b45]">
                          QR төлбөр
                        </span>
                      </div>
                    </section>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#e1d0ac] bg-[#fff8e7] px-4 py-3 text-xs leading-5 text-[#795f2f]">
                    Төлбөр хийсний дараа баримтаа хадгална уу. Автомат
                    баталгаажуулалтгүй тул зөвлөхтэй чатаар төлбөр орсныг
                    нягталж болно.
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPayment(false)}
                    className="mt-5 w-full rounded-full bg-[#55796a] px-6 py-4 text-sm font-extrabold text-white"
                  >
                    Ойлголоо
                  </button>
                </div>
              </div>
            </div>
          )}

          {showCalendar && therapist.calendlyURL && (
            <section className="mb-6 overflow-hidden rounded-[24px] border border-[#d7e3dd] bg-white">
              <div className="flex items-center justify-between bg-[#edf4f0] px-5 py-4">
                <div>
                  <p className="font-bold text-[#46675a]">
                    Боломжит цагаас сонгоно уу
                  </p>
                  <p className="text-xs text-[#6d8178]">
                    Calendly цаг сонголт энэ хуудсанд шууд харагдана.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="text-sm font-bold text-[#55796a]"
                >
                  Хураах
                </button>
              </div>
              <iframe
                title={`${therapist.name} цаг сонгох`}
                src={calendlyEmbed(therapist.calendlyURL)}
                className="h-[680px] w-full border-0"
              />
            </section>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onChat}
              disabled={pending}
              className="flex-1 rounded-full bg-[#55796a] px-6 py-4 text-sm font-extrabold text-white transition hover:bg-[#46675a] disabled:opacity-50"
            >
              {pending ? "Чат нээж байна..." : "Нэвтрэхгүйгээр шууд чатлах"}
            </button>
            {therapist.calendlyURL && (
              <button
                type="button"
                onClick={() => setShowCalendar((current) => !current)}
                className="flex-1 rounded-full border border-[#9fb9ad] bg-white px-6 py-4 text-sm font-extrabold text-[#46675a]"
              >
                Боломжит цаг харах
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatHub({
  therapists,
}: {
  therapists: ChatTherapist[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<{
    therapist: ChatTherapist
    showCalendar: boolean
  } | null>(null)
  const [category, setCategory] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [day, setDay] = useState("")
  const [time, setTime] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const specializationOptions = useMemo(
    () =>
      Array.from(
        new Set(therapists.flatMap((therapist) => therapist.specializations)),
      ).slice(0, 18),
    [therapists],
  )
  const matches = therapists.filter((therapist) => {
    const hasAvailableSlot =
      !day ||
      therapist.chatAvailability.some(
        (slot) =>
          slot.day === day &&
          (!time || (slot.startTime <= time && slot.endTime >= time)),
      )
    return (
      (!category || therapist.categories.includes(category)) &&
      (!specialization ||
        therapist.specializations.includes(specialization)) &&
      hasAvailableSlot
    )
  })

  const openConversation = (therapist: ChatTherapist) => {
    setError("")
    startTransition(async () => {
      try {
        const conversation = await createGuestConversation({
          therapistId: therapist.id,
          therapistName: therapist.name,
        })
        router.push(`/chat/${conversation.id}`)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Чат нээж чадсангүй. Дахин оролдоно уу.",
        )
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-[#2d2620]">
      <header className="border-b border-[#e7ddd2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="font-display text-xl font-semibold">
            Сэтгэлзүйч
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#ded3c6] px-4 py-2 text-sm font-bold text-[#6f6257]"
          >
            ← Нүүр рүү буцах
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-14">
        <section className="grid gap-7 rounded-[32px] bg-[#55796a] p-7 text-white lg:grid-cols-[1fr_420px] lg:p-10">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/60">
              Supabase Realtime chat
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Танд тохирох зөвлөхтэй яг одоо ярилцаарай
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
              Бүртгэл, нэвтрэлт шаардахгүй. Асуудлын чиглэл болон боломжит
              цагаар шүүгээд зөвлөхтэй шууд чат эхлүүлнэ.
            </p>
          </div>
          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="font-bold">Ухаалаг туслахын зөвлөгөө</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Яаралтай аюултай нөхцөлд чат хүлээлгүй 103 эсвэл орон нутгийн
              тусламжийн байгууллагад хандана уу. Энэ чат эмнэлгийн яаралтай
              тусламжийг орлохгүй.
            </p>
          </div>
        </section>

        <section className="mt-7 rounded-[26px] border border-[#e5d9ce] bg-white p-5 shadow-[0_14px_45px_rgba(74,58,45,0.05)]">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            >
              <option value="">Бүх зөвлөгөө</option>
              <option value="personal">Хувь хүний зөвлөгөө</option>
              <option value="couples">Хосын зөвлөгөө</option>
              <option value="teen">Өсвөр насны зөвлөгөө</option>
              <option value="family">Хүүхдийн зөвлөгөө</option>
            </select>
            <select
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
              className={inputClass}
            >
              <option value="">Бүх мэргэшил</option>
              {specializationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className={inputClass}
            >
              <option value="">Бүх боломжит өдөр</option>
              {days.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              disabled={!day}
              aria-label="Боломжит цаг"
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-45`}
            />
          </div>
        </section>

        <div className="mt-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#7a9e8e]">
              {matches.length} зөвлөх олдлоо
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Зөвлөхөө сонгоно уу
            </h2>
          </div>
          {(category || specialization || day || time) && (
            <button
              type="button"
              onClick={() => {
                setCategory("")
                setSpecialization("")
                setDay("")
                setTime("")
              }}
              className="text-sm font-bold text-[#735b45] underline underline-offset-4"
            >
              Шүүлтүүр цэвэрлэх
            </button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-2xl bg-[#fff0e9] px-4 py-3 text-sm font-bold text-[#96533e]"
          >
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((therapist) => (
            <article
              key={therapist.id}
              className="group rounded-[28px] border border-[#e5d9ce] bg-white p-5 transition hover:-translate-y-1 hover:border-[#b8cec4] hover:shadow-[0_20px_60px_rgba(74,58,45,0.09)]"
            >
              <div className="flex gap-4">
                {therapist.photo ? (
                  <Image
                    src={therapist.photo.url}
                    alt={therapist.photo.alt}
                    width={88}
                    height={88}
                    className="h-22 w-22 rounded-full border border-[#70c4cb] object-cover p-0.5"
                  />
                ) : (
                  <div className="flex h-22 w-22 shrink-0 items-center justify-center rounded-full border border-[#70c4cb] bg-[#dfece6] font-display text-2xl text-[#55796a]">
                    {therapist.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-xl font-semibold">
                      {therapist.name}
                    </h3>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4e9279] text-[11px] text-white">
                      ✓
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#7d6f63]">
                    {therapist.professionalTitle}
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#8b6f52]">
                    {therapist.experience} жил ·{" "}
                    {therapist.price.toLocaleString("mn-MN")}₮
                  </p>
                </div>
              </div>
              <div className="mt-4 flex min-h-14 flex-wrap content-start gap-1.5">
                {therapist.specializations.slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#edf4f0] px-2.5 py-1 text-xs font-bold text-[#55796a]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 border-t border-[#eee5dc] pt-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#998a7d]">
                  Чатлах цаг
                </p>
                <p className="mt-1 line-clamp-1 text-sm font-bold text-[#5f534a]">
                  {therapist.chatAvailability.length
                    ? therapist.chatAvailability
                        .slice(0, 2)
                        .map(
                          (slot) =>
                            `${dayLabel(slot.day)} ${slot.startTime}–${slot.endTime}`,
                        )
                        .join(" · ")
                    : "Чатаар цаг тохиролцоно"}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelected({ therapist, showCalendar: false })
                  }
                  className="rounded-full border border-[#d9c7b2] px-2 py-3 text-xs font-extrabold text-[#6f543c]"
                >
                  Дэлгэрэнгүй
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelected({ therapist, showCalendar: true })
                  }
                  disabled={!therapist.calendlyURL}
                  title={
                    therapist.calendlyURL
                      ? "Calendly дээр боломжит цаг сонгох"
                      : "Энэ зөвлөх Calendly холбоосоо тохируулаагүй байна"
                  }
                  className="rounded-full border border-[#9fb9ad] bg-[#edf4f0] px-2 py-3 text-xs font-extrabold text-[#46675a] disabled:cursor-not-allowed disabled:border-[#ded3c6] disabled:bg-[#f3eee8] disabled:text-[#a39487]"
                >
                  Цаг сонгох
                </button>
                <button
                  type="button"
                  onClick={() => openConversation(therapist)}
                  disabled={isPending}
                  className="rounded-full bg-[#55796a] px-2 py-3 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  Шууд чатлах
                </button>
              </div>
            </article>
          ))}
        </div>

        {!matches.length && (
          <div className="mt-7 rounded-[28px] border border-dashed border-[#cfbda9] bg-white p-10 text-center">
            <h3 className="font-display text-2xl font-semibold">
              Энэ цагт тохирох зөвлөх олдсонгүй
            </h3>
            <p className="mt-2 text-sm text-[#7d6f63]">
              Өдөр, цагаа өөрчлөх эсвэл цагийн шүүлтүүрийг цэвэрлэнэ үү.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <TherapistDetail
          key={`${selected.therapist.id}-${selected.showCalendar ? "calendar" : "profile"}`}
          therapist={selected.therapist}
          onClose={() => setSelected(null)}
          onChat={() => openConversation(selected.therapist)}
          pending={isPending}
          initialCalendarOpen={selected.showCalendar}
        />
      )}
    </div>
  )
}

const inputClass =
  "w-full rounded-2xl border border-[#ded3c6] bg-white px-4 py-3 text-sm font-bold text-[#3e342c] outline-none transition focus:border-[#7a9e8e] focus:ring-4 focus:ring-[#7a9e8e]/10"
