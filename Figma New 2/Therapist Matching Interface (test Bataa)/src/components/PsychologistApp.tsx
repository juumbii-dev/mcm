"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

// ── Types ─────────────────────────────────────────────────────────────────────

type Therapist = {
  id: number | string
  name: string
  gender: string
  age: number
  ageGroup: string
  photo: string
  specializations: string[]
  categories: string[]
  format: string[]
  location: { aimag: string; district: string }
  experience: number
  rating: number
  sessions: number
  price: number
  bio: string
  calendlyURL?: string
  meetingProvider?: "google-meet" | "zoom"
}
type BookingScreen = "match" | "profile" | "booking-request" | "therapist-availability" | "client-select-time" | "therapist-confirm" | "booking-confirmed" | "payment-meeting"

// ── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "personal",
    label: "Хувь хүний зөвлөгөө",
    icon: "🌱",
    desc: "Өөрийгөө таньж, хөгжүүлэх замналд",
  },
  {
    id: "couples",
    label: "Хосын харилцааны зөвлөгөө",
    icon: "🫂",
    desc: "Хосын хамтын ойлголцол, холбоо",
  },
  {
    id: "teen",
    label: "Өсвөр насны зөвлөгөө",
    icon: "🌟",
    desc: "Залуучуудад зориулсан дэмжлэг",
  },
  {
    id: "family",
    label: "Хүүхдийн зөвлөгөө",
    icon: "🏡",
    desc: "Хүүхдийн хөгжил, сэтгэл зүй",
  },
  { id: "other", label: "Бусад", icon: "✦", desc: "Өөр чиглэлийн туслалцаа" },
]

const SPECIALIZATIONS = [
  "Харилцааны бэрхшээл",
  "Амьдралын зорилго",
  "Ганцаардал / Тусгаарлагдал",
  "Өөрийгөө хайрлах",
  "Нийгмийн түгшүүр ба фоби",
  "Буруутгал ба ичгүүр",
  "Гэмтлийн дараах стресс (PTSD)",
  "Паник дарамт ба халдлага",
  "Хяналтын асуудал",
  "Уучлал",
  "Асрагчийн стресс",
  "Жирэмслэлт ба төрөлт",
  "Гэрлэлт цуцлалт",
  "Стресс ба сэтгэлийн зовниул",
  "Донтолтоос гарах",
  "ЛГБТК+ асуудал",
  "Гэр бүлийн зөрчил",
  "Гэмт хэрэг ба хүчирхийлэл",
  "Алдагдал ба гашуудал",
  "Дотно харилцааны асуудал",
  "Хоол тэжээлийн эмгэг",
  "Нойрны эмгэг",
  "Эцэг эхийн асуудал",
  "Урам зориг ба өөртөө итгэх",
  "Уур хилэн удирдах",
  "Ажил мэргэжлийн бэрхшээл",
  "Хоёр туйлт эмгэг",
  "Амьдралын өөрчлөлттэй зохицох",
  "Гүйцэтгэлийн дасгалжуулалт",
  "Энэрлийн ядаргаа",
  "Анхаарал ба ADHD",
]

const GENDERS = [
  { id: "female", label: "Эмэгтэй", icon: "♀" },
  { id: "male", label: "Эрэгтэй", icon: "♂" },
  { id: "any", label: "Хамаагүй", icon: "✦" },
]

const AGE_GROUPS = [
  { id: "25-35", label: "25–35 нас" },
  { id: "35-45", label: "35–45 нас" },
  { id: "45-55", label: "45–55 нас" },
  { id: "55+", label: "55+ нас" },
]

const AIMAGS = [
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорноговь",
  "Дорнод",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
  "Улаанбаатар",
]

const UB_DISTRICTS = [
  "Багануур",
  "Багахангай",
  "Баянгол",
  "Баянзүрх",
  "Налайх",
  "Сонгинохайрхан",
  "Сүхбаатар",
  "Хан-Уул",
  "Чингэлтэй",
]

const OTHER_DISTRICTS = ["Төв", "Зүүн", "Баруун", "Хойд", "Өмнөд"]

const PAYMENT_ACCOUNT_NUMBER = "290005005026909442"
const SOCIALPAY_NUMBER = "89880034"
const PAYMENT_TOTAL = 80000

const DEFAULT_THERAPIST: Therapist = {
  id: "",
  name: "",
  gender: "",
  age: 0,
  ageGroup: "",
  photo: "/favicon.svg",
  specializations: [],
  categories: [],
  format: [],
  location: { aimag: "", district: "" },
  experience: 0,
  rating: 0,
  sessions: 0,
  price: 0,
  bio: "",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeMatch(
  therapist: Therapist,
  prefs: {
    category: string
    specs: string[]
    gender: string
    ageGroup: string
    format: string
    aimag: string
    district: string
  },
): number {
  let score = 0,
    total = 0
  total += 20
  if (therapist.categories.includes(prefs.category)) score += 20
  if (prefs.specs.length > 0) {
    total += 40
    const matched = prefs.specs.filter((s) =>
      therapist.specializations.includes(s),
    ).length
    score += Math.round((matched / prefs.specs.length) * 40)
  }
  total += 15
  if (prefs.gender === "any" || therapist.gender === prefs.gender) score += 15
  if (prefs.ageGroup) {
    total += 10
    if (therapist.ageGroup === prefs.ageGroup) score += 10
  }
  total += 15
  if (therapist.format.includes(prefs.format)) score += 15
  return Math.round((score / total) * 100)
}

function formatPrice(n: number) {
  return n.toLocaleString("mn-MN") + "₮"
}

function getPsychologistList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []

  const response = payload as Record<string, unknown>
  if (Array.isArray(response.psychologists)) return response.psychologists
  if (Array.isArray(response.profiles)) return response.profiles
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.docs)) return response.docs

  if (response.data && typeof response.data === "object") {
    const data = response.data as Record<string, unknown>
    if (Array.isArray(data.psychologists)) return data.psychologists
    if (Array.isArray(data.profiles)) return data.profiles
  }
  return []
}

function normalizePsychologist(
  value: unknown,
): Therapist | null {
  if (!value || typeof value !== "object") return null

  const profile = value as Partial<Therapist> & {
    id?: number | string
    profile?: Partial<Therapist>
  }
  const details = profile.profile ?? profile
  const id = profile.id ?? details.id
  if (typeof id !== "string" && typeof id !== "number") return null

  const base = DEFAULT_THERAPIST
  const media = details.photo as unknown as { url?: string } | string | undefined
  return {
    ...base,
    ...details,
    id,
    photo: typeof media === "string" ? media : media?.url || base.photo,
    location: {
      ...base.location,
      ...(details.location ?? {}),
    },
    specializations: Array.isArray(details.specializations)
      ? details.specializations
      : base.specializations,
    categories: Array.isArray(details.categories)
      ? details.categories
      : base.categories,
    format: Array.isArray(details.format) ? details.format : base.format,
  }
}

// Generate available slots (next 7 days, random times)
function generateSlots() {
  const slots: { date: string; time: string; label: string }[] = []
  const days = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]
  const times = [
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ]
  for (let d = 1; d <= 7; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)
    const dayName = days[date.getDay()]
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const label = `${dayName}, ${date.getMonth() + 1}/${date.getDate()}`
    const pickedTimes = times
      .filter((_, index) => (index + d) % 2 === 0)
      .slice(0, 4)
    pickedTimes.forEach((t) => slots.push({ date: dateStr, time: t, label }))
  }
  return slots
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  )
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  full = true,
  size = "md",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "sage" | "ghost"
  full?: boolean
  size?: "sm" | "md"
}) {
  const bg = disabled
    ? "#e8e0d5"
    : variant === "primary"
      ? "#8b6f52"
      : variant === "sage"
        ? "#7a9e8e"
        : variant === "ghost"
          ? "transparent"
          : "#e8e0d5"
  const color = disabled
    ? "#c8a882"
    : variant === "ghost"
      ? "#8a7968"
      : variant === "secondary"
        ? "#8a7968"
        : "#fff"
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${
        full ? "w-full" : ""
      } rounded-2xl font-semibold transition-all hover:opacity-90 ${
        size === "sm" ? "px-4 py-2 text-sm" : "py-4 text-sm"
      }`}
      style={{
        background: bg,
        color,
        cursor: disabled ? "default" : "pointer",
        border: variant === "ghost" ? "1.5px solid #e8e0d5" : "none",
      }}
    >
      {children}
    </button>
  )
}

function StepIndicator({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`rounded-full transition-all duration-300 flex items-center justify-center ${
              i < current
                ? "w-6 h-6 bg-[#7a9e8e]"
                : i === current
                  ? "w-8 h-8 bg-[#8b6f52]"
                  : "w-5 h-5 bg-[#e8e0d5]"
            }`}
          >
            {i < current && <span className="text-white text-xs">✓</span>}
            {i === current && (
              <span className="text-white text-xs font-bold">{i + 1}</span>
            )}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-6 rounded ${
                i < current ? "bg-[#7a9e8e]" : "bg-[#e8e0d5]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function Tag({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? "#8b6f52" : "#f7f3ee",
        color: active ? "#fff" : "#8a7968",
        border: `1.5px solid ${active ? "#8b6f52" : "#e8e0d5"}`,
      }}
    >
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wider mb-3"
      style={{ color: "#8a7968" }}
    >
      {children}
    </p>
  )
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Fraunces', serif",
        color: "#2d2620",
        fontSize: 26,
        fontWeight: 700,
        lineHeight: 1.25,
      }}
      className="mb-2"
    >
      {children}
    </h2>
  )
}

function NotifBox({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        background: "rgba(122,158,142,0.1)",
        border: "1.5px solid rgba(122,158,142,0.3)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: "#7a9e8e" }}>🔔</span>
        <span className="font-semibold text-sm" style={{ color: "#7a9e8e" }}>
          {title}
        </span>
      </div>
      <div className="text-sm" style={{ color: "#2d2620", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  // Match flow
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState("")
  const [specs, setSpecs] = useState<string[]>([])
  const [gender, setGender] = useState("any")
  const [ageGroup, setAgeGroup] = useState("")
  const [format, setFormat] = useState("")
  const [aimag, setAimag] = useState("")
  const [district, setDistrict] = useState("")

  // Booking flow
  const [bookingScreen, setBookingScreen] = useState<BookingScreen>("match")
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(
    null,
  )
  const [bookingNote, setBookingNote] = useState("")
  const [therapistSlots] = useState(generateSlots)
  const [clientSelectedSlot, setClientSelectedSlot] = useState<{
    date: string
    time: string
    label: string
  } | null>(null)
  const [therapistOfferedSlots, setTherapistOfferedSlots] = useState<string[]>(
    [],
  )

  // Cancellation policy
  const [cancelHours, setCancelHours] = useState(2)
  const [rescheduleHours, setRescheduleHours] = useState(24)
  const [paymentHoursBefore, setPaymentHoursBefore] = useState(24)
  const [noRefundHours, setNoRefundHours] = useState(2)
  const [refundHours, setRefundHours] = useState(3)

  // Payment & meeting
  const [sendMeetingLink, setSendMeetingLink] = useState<boolean | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isSavingBooking, setIsSavingBooking] = useState(false)
  const [bookingSaveError, setBookingSaveError] = useState("")
  const [bookingId, setBookingId] = useState<number | string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPsychologists() {
      try {
        const response = await fetch("/api/therapist-profiles?where[status][equals]=approved&depth=1&limit=100", {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Psychologists API returned ${response.status}`)
        }

        const list = getPsychologistList(await response.json())
        const normalized = list
          .map((profile) =>
            normalizePsychologist(profile),
          )
          .filter((profile): profile is Therapist => profile !== null)

        if (normalized.length === 0) {
          throw new Error("Psychologists API returned an empty list")
        }
        setTherapists(normalized)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        console.error(
          "Psychologist жагсаалтыг ачаалж чадсангүй. Статик жагсаалт ашиглаж байна.",
          error,
        )
        setTherapists([])
      }
    }

    void loadPsychologists()
    return () => controller.abort()
  }, [])

  const resultStep = format === "inperson" ? 5 : 4
  const totalMatchSteps = format === "inperson" ? 5 : 4

  const districts = aimag === "Улаанбаатар" ? UB_DISTRICTS : OTHER_DISTRICTS

  const matches = therapists.map((t) => ({
    ...t,
    score: computeMatch(t, {
      category,
      specs,
      gender,
      ageGroup,
      format,
      aimag,
      district,
    }),
  }))
    .filter((t) => t.score >= 50)
    .sort((a, b) => b.score - a.score)

  function toggleSpec(s: string) {
    setSpecs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  function handleFormatSelect(f: string) {
    setFormat(f)
    setAimag("")
    setDistrict("")
  }

  function canNext(): boolean {
    if (step === 0) return !!category
    if (step === 1) return specs.length > 0
    if (step === 3) return !!format
    if (step === 4 && format === "inperson") return !!aimag && !!district
    return true
  }

  function nextStep() {
    if (!canNext()) return
    const last = format === "inperson" ? 4 : 3
    setStep((s) => (s === last ? resultStep : s + 1))
  }

  function startBooking(t: Therapist) {
    setSelectedTherapist(t)
    setBookingScreen("profile")
  }

  function resetAll() {
    setStep(0)
    setCategory("")
    setSpecs([])
    setGender("any")
    setAgeGroup("")
    setFormat("")
    setAimag("")
    setDistrict("")
    setBookingScreen("match")
    setSelectedTherapist(null)
    setBookingNote("")
    setClientSelectedSlot(null)
    setTherapistOfferedSlots([])
    setSendMeetingLink(null)
    setPaymentMethod("")
    setBookingSaveError("")
  }

  async function saveBooking() {
    if (!t || !confirmedSlot || !paymentMethod || isSavingBooking) return

    setIsSavingBooking(true)
    setBookingSaveError("")

    const meetingLink =
      format === "online" && sendMeetingLink
        ? `https://meet.setgelzuich.mn/room/${t.id}-${confirmedSlot.date}-${confirmedSlot.time.replace(":", "")}`
        : null

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapist: t.id,
          date: new Date(`${confirmedSlot.date}T00:00:00`).toISOString(),
          time: confirmedSlot.time,
          format,
          note: bookingNote || null,
          paymentMethod,
          meetingLink,
        }),
      })

      if (!response.ok) {
        throw new Error(`Bookings API returned ${response.status}`)
      }

      const text = await response.text()
      const result = text ? (JSON.parse(text) as Record<string, unknown>) : {}
      const booking =
        result.booking && typeof result.booking === "object"
          ? (result.booking as Record<string, unknown>)
          : null
      const data =
        result.data && typeof result.data === "object"
          ? (result.data as Record<string, unknown>)
          : null
      const savedId =
        result.id ??
        result.bookingId ??
        booking?.id ??
        booking?.bookingId ??
        data?.id ??
        data?.bookingId
      if (typeof savedId === "string" || typeof savedId === "number") {
        setBookingId(savedId)
      }
      resetAll()
    } catch (error) {
      console.error("Захиалга хадгалах хүсэлт амжилтгүй боллоо.", error)
      setBookingSaveError("Захиалга хадгалахад алдаа гарлаа")
    } finally {
      setIsSavingBooking(false)
    }
  }

  const t = selectedTherapist

  const slotsByDate =
    therapistSlots.reduce<Record<string, typeof therapistSlots>>((acc, s) => {
      ;(acc[s.date] = acc[s.date] || []).push(s)
      return acc
    }, {})

  const offeredSlotObjects = therapistSlots.filter((s) =>
    therapistOfferedSlots.includes(`${s.date}-${s.time}`),
  )

  const confirmedSlot = clientSelectedSlot
  const confirmedEnd = confirmedSlot
    ? (() => {
        const [h, m] = confirmedSlot.time.split(":").map(Number)
        return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      })()
    : ""

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderMatchFlow() {
    return (
      <div className="w-full max-w-2xl">
        {step > 0 && step < resultStep && (
          <StepIndicator current={step} total={totalMatchSteps} />
        )}

        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <div className="text-center mb-10">
              <h1
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: "#2d2620",
                  fontSize: 32,
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
                className="mb-3"
              >
                Та ямар зөвлөгөө
                <br />
                <em style={{ color: "#8b6f52" }}>хүсч байна вэ?</em>
              </h1>
              <p style={{ color: "#8a7968", fontSize: 15 }}>
                Өөртөө тохирох чиглэлийг сонгоно уу
              </p>
            </div>
            <div className="grid gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="w-full text-left rounded-2xl px-6 py-5 flex items-center gap-5 transition-all duration-200"
                  style={{
                    background:
                      category === cat.id ? "#8b6f52" : "rgba(255,255,255,0.7)",
                    border: `2px solid ${
                      category === cat.id ? "#8b6f52" : "transparent"
                    }`,
                    boxShadow:
                      category === cat.id
                        ? "0 8px 24px rgba(139,111,82,0.25)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <div
                      className="font-semibold text-base"
                      style={{
                        color: category === cat.id ? "#fff" : "#2d2620",
                      }}
                    >
                      {cat.label}
                    </div>
                    <div
                      className="text-sm mt-0.5"
                      style={{
                        color:
                          category === cat.id
                            ? "rgba(255,255,255,0.75)"
                            : "#8a7968",
                      }}
                    >
                      {cat.desc}
                    </div>
                  </div>
                  {category === cat.id && (
                    <span className="ml-auto text-white text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={nextStep}
              disabled={!category}
              className="w-full mt-6 py-4 rounded-2xl font-semibold text-base transition-all"
              style={{
                background: category ? "#8b6f52" : "#e8e0d5",
                color: category ? "#fff" : "#c8a882",
                cursor: category ? "pointer" : "default",
              }}
            >
              Үргэлжлүүлэх →
            </button>
            <p className="mt-5 text-center text-sm text-[#8a7968]">
              Та зөвлөх үү?{" "}
              <Link
                href="/therapist-signup"
                className="font-bold text-[#7a9e8e] hover:underline"
              >
                Зөвлөхөөр бүртгүүлэх
              </Link>
            </p>
            <Link
              href="/chat"
              className="mt-5 flex items-center justify-between rounded-2xl border border-[#c9ddd4] bg-[#edf4f0] px-5 py-4 transition hover:border-[#7a9e8e]"
            >
              <span>
                <span className="block font-display text-lg font-semibold text-[#385c4d]">
                  Зөвлөхтэй чатлах
                </span>
                <span className="mt-1 block text-sm text-[#688074]">
                  Chatbot-оор зөвлөх сонгох эсвэл шууд чат эхлүүлэх
                </span>
              </span>
              <span className="font-bold text-[#55796a]">→</span>
            </Link>
          </div>
        )}

        {/* Step 1: Specializations */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <PageTitle>
                Ямар чиглэлээр мэргэшсэн
                <br />
                <em style={{ color: "#7a9e8e" }}>байвал сайн бэ?</em>
              </PageTitle>
              <p style={{ color: "#8a7968", fontSize: 14 }}>
                Нэг буюу хэд хэдийг сонгож болно
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSpec(s)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
                  style={{
                    background: specs.includes(s)
                      ? "#7a9e8e"
                      : "rgba(255,255,255,0.7)",
                    color: specs.includes(s) ? "#fff" : "#2d2620",
                    border: `1.5px solid ${
                      specs.includes(s) ? "#7a9e8e" : "#e8e0d5"
                    }`,
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {specs.includes(s) ? "✓ " : ""}
                  {s}
                </button>
              ))}
            </div>
            {specs.length > 0 && (
              <p
                className="text-center text-sm mb-4"
                style={{ color: "#7a9e8e" }}
              >
                {specs.length} сэдэв сонгогдлоо
              </p>
            )}
            <div className="flex gap-3">
              <Btn onClick={() => setStep((s) => s - 1)} variant="secondary">
                ← Буцах
              </Btn>
              <Btn onClick={nextStep} disabled={!canNext()} variant="sage">
                Үргэлжлүүлэх →
              </Btn>
            </div>
          </div>
        )}

        {/* Step 2: Gender & Age */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <PageTitle>
                Сэтгэлзүйчийн
                <br />
                <em style={{ color: "#8b6f52" }}>хүйс, насыг</em> сонгох уу?
              </PageTitle>
              <p style={{ color: "#8a7968", fontSize: 14 }}>
                Заавал биш — хүссэн тохиолдолд сонгоно уу
              </p>
            </div>
            <Card className="mb-4">
              <SectionLabel>Хүйс</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                {GENDERS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    className="py-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                    style={{
                      background: gender === g.id ? "#8b6f52" : "#f7f3ee",
                      border: `2px solid ${
                        gender === g.id ? "#8b6f52" : "transparent"
                      }`,
                    }}
                  >
                    <span
                      className="text-xl"
                      style={{ color: gender === g.id ? "#fff" : "#8b6f52" }}
                    >
                      {g.icon}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: gender === g.id ? "#fff" : "#2d2620" }}
                    >
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="mb-6">
              <SectionLabel>Насны хүрээ (заавал биш)</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {AGE_GROUPS.map((ag) => (
                  <button
                    key={ag.id}
                    onClick={() => setAgeGroup(ageGroup === ag.id ? "" : ag.id)}
                    className="py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: ageGroup === ag.id ? "#c8a882" : "#f7f3ee",
                      color: ageGroup === ag.id ? "#fff" : "#2d2620",
                      border: `2px solid ${
                        ageGroup === ag.id ? "#c8a882" : "transparent"
                      }`,
                    }}
                  >
                    {ageGroup === ag.id ? "✓ " : ""}
                    {ag.label}
                  </button>
                ))}
              </div>
            </Card>
            <div className="flex gap-3">
              <Btn onClick={() => setStep((s) => s - 1)} variant="secondary">
                ← Буцах
              </Btn>
              <Btn onClick={nextStep}>Үргэлжлүүлэх →</Btn>
            </div>
          </div>
        )}

        {/* Step 3: Format */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <PageTitle>
                Хэрхэн уулзах
                <br />
                <em style={{ color: "#7a9e8e" }}>хүсч байна вэ?</em>
              </PageTitle>
            </div>
            <div className="grid gap-4 mb-6">
              {[
                {
                  id: "online",
                  label: "Онлайн уулзалт",
                  desc: "Видео дуудлагаар, дурын газраас",
                  icon: "💻",
                  color: "#7a9e8e",
                },
                {
                  id: "inperson",
                  label: "Биечлэн уулзалт",
                  desc: "Клиник буюу оффист биечлэн",
                  icon: "🏢",
                  color: "#8b6f52",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleFormatSelect(opt.id)}
                  className="w-full text-left rounded-2xl px-8 py-7 flex items-center gap-6 transition-all duration-200"
                  style={{
                    background:
                      format === opt.id ? opt.color : "rgba(255,255,255,0.7)",
                    border: `2px solid ${
                      format === opt.id ? opt.color : "transparent"
                    }`,
                    boxShadow:
                      format === opt.id
                        ? `0 8px 28px ${opt.color}44`
                        : "0 2px 8px rgba(0,0,0,0.05)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <div
                      className="font-bold text-lg"
                      style={{ color: format === opt.id ? "#fff" : "#2d2620" }}
                    >
                      {opt.label}
                    </div>
                    <div
                      className="text-sm mt-1"
                      style={{
                        color:
                          format === opt.id
                            ? "rgba(255,255,255,0.8)"
                            : "#8a7968",
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                  {format === opt.id && (
                    <span className="ml-auto text-white text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Btn onClick={() => setStep((s) => s - 1)} variant="secondary">
                ← Буцах
              </Btn>
              <Btn onClick={nextStep} disabled={!format} variant="sage">
                {format === "inperson"
                  ? "Байршил сонгох →"
                  : "Тохирох сэтгэлзүйч хайх →"}
              </Btn>
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {step === 4 && format === "inperson" && (
          <div>
            <div className="text-center mb-8">
              <PageTitle>
                Та хаана
                <br />
                <em style={{ color: "#8b6f52" }}>байрладаг вэ?</em>
              </PageTitle>
              <p style={{ color: "#8a7968", fontSize: 14 }}>
                Ойр орчмын сэтгэлзүйчийг олоход ашиглана
              </p>
            </div>
            <Card className="mb-4">
              <SectionLabel>Аймаг / Нийслэл</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {AIMAGS.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAimag(a)
                      setDistrict("")
                    }}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: aimag === a ? "#8b6f52" : "#f7f3ee",
                      color: aimag === a ? "#fff" : "#2d2620",
                      border: `1.5px solid ${
                        aimag === a ? "#8b6f52" : "#e8e0d5"
                      }`,
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Card>
            {aimag && (
              <Card className="mb-6">
                <SectionLabel>
                  {aimag === "Улаанбаатар" ? "Дүүрэг" : "Сум / Дүүрэг"}
                </SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {districts.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDistrict(d)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: district === d ? "#c8a882" : "#f7f3ee",
                        color: district === d ? "#fff" : "#2d2620",
                        border: `1.5px solid ${
                          district === d ? "#c8a882" : "#e8e0d5"
                        }`,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Card>
            )}
            <div className="flex gap-3">
              <Btn onClick={() => setStep((s) => s - 1)} variant="secondary">
                ← Буцах
              </Btn>
              <Btn onClick={nextStep} disabled={!aimag || !district}>
                Тохирох сэтгэлзүйч хайх →
              </Btn>
            </div>
          </div>
        )}

        {/* Results */}
        {step === resultStep && bookingScreen === "match" && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">✦</div>
              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: "#2d2620",
                  fontSize: 28,
                  fontWeight: 700,
                }}
                className="mb-2"
              >
                Таны хувьд <em style={{ color: "#8b6f52" }}>тохирох</em>
                <br />
                сэтгэлзүйчид
              </h2>
              <p style={{ color: "#8a7968", fontSize: 14 }}>
                {matches.length > 0
                  ? `${matches.length} сэтгэлзүйч олдлоо — 50%+ тохирол`
                  : "Тохирох сэтгэлзүйч олдсонгүй"}
              </p>
            </div>
            {matches.length === 0 && (
              <Card className="text-center py-10">
                <p style={{ color: "#8a7968" }}>
                  Шалгуураа өөрчлөн дахин хайна уу.
                </p>
                <div className="mt-4">
                  <Btn onClick={resetAll}>Дахин эхлэх</Btn>
                </div>
              </Card>
            )}
            <div className="grid gap-4">
              {matches.map((th) => (
                <Card key={th.id}>
                  <div className="flex gap-4 items-start">
                    <Image
                    width={96}
                    height={96}
                      src={th.photo}
                      alt={th.name}
                      className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                      style={{ background: "#e8e0d5" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-bold text-base"
                            style={{ color: "#2d2620" }}
                          >
                            {th.name}
                          </h3>
                          <p className="text-sm" style={{ color: "#8a7968" }}>
                            {th.age} нас · {th.experience} жилийн туршлага
                          </p>
                        </div>
                        <div
                          className="flex-shrink-0 rounded-xl px-3 py-1.5 text-center"
                          style={{
                            background:
                              th.score >= 80
                                ? "#7a9e8e"
                                : th.score >= 65
                                  ? "#c8a882"
                                  : "#e8e0d5",
                            minWidth: 64,
                          }}
                        >
                          <div
                            className="font-bold text-lg leading-none"
                            style={{
                              color: th.score >= 65 ? "#fff" : "#8a7968",
                            }}
                          >
                            {th.score}%
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{
                              color:
                                th.score >= 65
                                  ? "rgba(255,255,255,0.8)"
                                  : "#8a7968",
                            }}
                          >
                            тохирол
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "#8b6f52" }}
                        >
                          ★ {th.rating}
                        </span>
                        <span className="text-xs" style={{ color: "#8a7968" }}>
                          {th.sessions} сессий
                        </span>
                        <span className="text-xs" style={{ color: "#8a7968" }}>
                          {formatPrice(th.price)}/цаг
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {th.specializations.slice(0, 4).map((s) => (
                      <Tag key={s} active={specs.includes(s)}>
                        {s}
                      </Tag>
                    ))}
                    {th.specializations.length > 4 && (
                      <Tag>+{th.specializations.length - 4}</Tag>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Btn
                      onClick={() => startBooking(th)}
                      variant="ghost"
                      full={false}
                      size="sm"
                    >
                      Дэлгэрэнгүй
                    </Btn>
                    <Btn onClick={() => startBooking(th)} size="sm">
                      Цаг захиалах →
                    </Btn>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6">
              <Btn onClick={resetAll} variant="secondary">
                Дахин хайх
              </Btn>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Booking screens ─────────────────────────────────────────────────────────

  function renderBooking() {
    if (!t) return null

    // Profile
    if (bookingScreen === "profile")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("match")}
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: "#8a7968" }}
          >
            ← Буцах
          </button>
          <Card className="mb-4">
            <div className="flex gap-4 items-start">
              <Image
                    width={96}
                    height={96}
                src={t.photo}
                alt={t.name}
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ background: "#e8e0d5" }}
              />
              <div>
                <h2
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: "#2d2620",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {t.name}
                </h2>
                <p className="text-sm mt-1" style={{ color: "#8a7968" }}>
                  {t.age} нас · {t.experience} жилийн туршлага · ★ {t.rating}
                </p>
                <p
                  className="text-sm mt-1 font-semibold"
                  style={{ color: "#8b6f52" }}
                >
                  {formatPrice(t.price)} / цаг
                </p>
              </div>
            </div>
            <p
              className="mt-4 text-sm"
              style={{ color: "#4a3f35", lineHeight: 1.7 }}
            >
              {t.bio}
            </p>
          </Card>
          <Card className="mb-4">
            <SectionLabel>Мэргэшлийн чиглэлүүд</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {t.specializations.map((s) => (
                <Tag key={s} active={specs.includes(s)}>
                  {s}
                </Tag>
              ))}
            </div>
          </Card>
          <Card className="mb-6">
            <SectionLabel>Уулзалтын хэлбэр</SectionLabel>
            <div className="flex gap-3">
              {t.format.map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-full text-sm"
                  style={{ background: "#e8f0ec", color: "#7a9e8e" }}
                >
                  {f === "online" ? "💻 Онлайн" : "🏢 Биечлэн"}
                </span>
              ))}
            </div>
          </Card>
          {t.format.includes("online") && t.calendlyURL && (
            <Card className="mb-4 overflow-hidden">
              <SectionLabel>Онлайн цаг шууд сонгох</SectionLabel>
              <p className="mb-4 text-sm text-[#6f6257]">
                Доорх Calendly харагдацаас боломжит цагаа сонгоход{" "}
                {t.meetingProvider === "zoom" ? "Zoom" : "Google Meet"}{" "}
                уулзалтын холбоос баталгаажуулалттай хамт очно.
              </p>
              <iframe
                title={`${t.name} Calendly цаг сонгох`}
                src={`${t.calendlyURL}${t.calendlyURL.includes("?") ? "&" : "?"}hide_gdpr_banner=1&background_color=fffdf9&text_color=2d2620&primary_color=7a9e8e`}
                className="h-[660px] w-full rounded-2xl border border-[#d7e3dd]"
              />
            </Card>
          )}
          <Btn onClick={() => setBookingScreen("booking-request")}>
            {t.calendlyURL
              ? "Дотоод хүсэлтээр цаг авах →"
              : "Цаг захиалах хүсэлт илгээх →"}
          </Btn>
        </div>
      )

    // Booking request (client → therapist)
    if (bookingScreen === "booking-request")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("profile")}
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: "#8a7968" }}
          >
            ← Буцах
          </button>
          <div className="text-center mb-6">
            <PageTitle>
              Цаг захиалах
              <br />
              <em style={{ color: "#8b6f52" }}>хүсэлт илгээх</em>
            </PageTitle>
            <p style={{ color: "#8a7968", fontSize: 14 }}>
              Та хүсэлтээ илгээсний дараа сэтгэлзүйч бололцоот цагаа санал
              болгоно
            </p>
          </div>
          <Card className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Image
                    width={96}
                    height={96}
                src={t.photo}
                alt={t.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <div
                  className="font-semibold text-sm"
                  style={{ color: "#2d2620" }}
                >
                  {t.name}
                </div>
                <div className="text-xs" style={{ color: "#8a7968" }}>
                  {formatPrice(t.price)} / цаг
                </div>
              </div>
            </div>
            <SectionLabel>Нэмэлт тэмдэглэл (заавал биш)</SectionLabel>
            <textarea
              value={bookingNote}
              onChange={(e) => setBookingNote(e.target.value)}
              placeholder="Жишээ нь: Ажил мэргэжлийн стресс, гэр бүлийн маргаан зэрэг сэдвүүдийн талаар ярилцмаар байна..."
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
              style={{
                background: "#f7f3ee",
                border: "1.5px solid #e8e0d5",
                color: "#2d2620",
                fontFamily: "'Nunito', sans-serif",
              }}
            />
          </Card>
          <NotifBox title="Сэтгэлзүйчид илгээгдэх мэдэгдэл">
            <span style={{ color: "#8a7968" }}>
              Шинэ цаг захиалах хүсэлт ирлээ!
            </span>
            <br />
            <strong>{t.name}</strong> та руу хүсэлт ирсэн байна.
            <br />
            Үйлчлүүлэгч: <strong>Та (үйлчлүүлэгч)</strong>
            <br />
            Чиглэл:{" "}
            <strong>{specs.slice(0, 2).join(", ") || "Заагдаагүй"}</strong>
            <br />
            Хэлбэр:{" "}
            <strong>{format === "online" ? "Онлайн" : "Биечлэн"}</strong>
            <br />
            {bookingNote && (
              <>
                Тэмдэглэл: <em>"{bookingNote}"</em>
              </>
            )}
          </NotifBox>
          <Btn onClick={() => setBookingScreen("therapist-availability")}>
            Хүсэлт илгээх ✓
          </Btn>
        </div>
      )

    // Therapist sets available slots
    if (bookingScreen === "therapist-availability")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("booking-request")}
            className="mb-6 flex items-center gap-2 text-sm text-[#8a7968]"
          >
            ← Буцах
          </button>
          <div
            className="mb-6 rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{
              background: "rgba(139,111,82,0.1)",
              border: "1.5px solid rgba(139,111,82,0.25)",
            }}
          >
            <span>👤</span>
            <span
              className="text-sm font-semibold"
              style={{ color: "#8b6f52" }}
            >
              Сэтгэлзүйчийн харагдац — {t.name}
            </span>
          </div>
          <div className="text-center mb-6">
            <PageTitle>
              Бололцоот цагаа
              <br />
              <em style={{ color: "#7a9e8e" }}>санал болгох</em>
            </PageTitle>
            <p style={{ color: "#8a7968", fontSize: 14 }}>
              Үйлчлүүлэгчид санал болгох цагуудаа сонгоно уу
            </p>
          </div>
          <div className="grid gap-3 mb-6">
            {Object.entries(slotsByDate).map(([date, daySlots]) => (
              <Card key={date}>
                <p
                  className="font-semibold text-sm mb-3"
                  style={{ color: "#2d2620" }}
                >
                  {daySlots[0].label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const key = `${slot.date}-${slot.time}`
                    const active = therapistOfferedSlots.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setTherapistOfferedSlots((prev) =>
                            active
                              ? prev.filter((k) => k !== key)
                              : [...prev, key],
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: active ? "#7a9e8e" : "#f7f3ee",
                          color: active ? "#fff" : "#2d2620",
                          border: `1.5px solid ${
                            active ? "#7a9e8e" : "#e8e0d5"
                          }`,
                        }}
                      >
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
          {therapistOfferedSlots.length > 0 && (
            <p
              className="text-center text-sm mb-4"
              style={{ color: "#7a9e8e" }}
            >
              {therapistOfferedSlots.length} цаг сонгогдлоо
            </p>
          )}
          <NotifBox title="Үйлчлүүлэгчид илгээгдэх мэдэгдэл">
            <strong>{t.name}</strong> таны хүсэлтэд хариу өгсөн байна.
            <br />
            Та доорх бололцоот цагуудаас сонгон захиалгаа баталгаажуулна уу.
          </NotifBox>
          <Btn
            onClick={() => setBookingScreen("client-select-time")}
            disabled={therapistOfferedSlots.length === 0}
            variant="sage"
          >
            Санал болгох цагуудыг илгээх →
          </Btn>
        </div>
      )

    // Client selects time
    if (bookingScreen === "client-select-time")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("therapist-availability")}
            className="mb-6 flex items-center gap-2 text-sm text-[#8a7968]"
          >
            ← Буцах
          </button>
          <div className="text-center mb-6">
            <PageTitle>
              <em style={{ color: "#8b6f52" }}>Цаг сонгох</em>
            </PageTitle>
            <p style={{ color: "#8a7968", fontSize: 14 }}>
              {t.name} санал болгосон цагуудаас нэгийг сонгоно уу
            </p>
          </div>
          <div className="grid gap-3 mb-6">
            {Object.entries(
              offeredSlotObjects.reduce<Record<string, typeof offeredSlotObjects>>(
                (acc, s) => {
                  ;(acc[s.date] = acc[s.date] || []).push(s)
                  return acc
                },
                {},
              ),
            ).map(([date, daySlots]) => (
              <Card key={date}>
                <p
                  className="font-semibold text-sm mb-3"
                  style={{ color: "#2d2620" }}
                >
                  {daySlots[0].label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const active =
                      clientSelectedSlot?.date === slot.date &&
                      clientSelectedSlot?.time === slot.time
                    return (
                      <button
                        key={`${slot.date}-${slot.time}`}
                        onClick={() => setClientSelectedSlot(slot)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: active ? "#8b6f52" : "#f7f3ee",
                          color: active ? "#fff" : "#2d2620",
                          border: `1.5px solid ${
                            active ? "#8b6f52" : "#e8e0d5"
                          }`,
                          boxShadow: active
                            ? "0 4px 12px rgba(139,111,82,0.3)"
                            : "none",
                        }}
                      >
                        {active ? "✓ " : ""}
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
          <Btn
            onClick={() => setBookingScreen("therapist-confirm")}
            disabled={!clientSelectedSlot}
          >
            {clientSelectedSlot
              ? `${clientSelectedSlot.label} — ${clientSelectedSlot.time} цагийг сонгох →`
              : "Цаг сонгоно уу"}
          </Btn>
        </div>
      )

    // Therapist confirms
    if (bookingScreen === "therapist-confirm")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("client-select-time")}
            className="mb-6 flex items-center gap-2 text-sm text-[#8a7968]"
          >
            ← Буцах
          </button>
          <div
            className="mb-6 rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{
              background: "rgba(139,111,82,0.1)",
              border: "1.5px solid rgba(139,111,82,0.25)",
            }}
          >
            <span>👤</span>
            <span
              className="text-sm font-semibold"
              style={{ color: "#8b6f52" }}
            >
              Сэтгэлзүйчийн харагдац — {t.name}
            </span>
          </div>
          <div className="text-center mb-6">
            <PageTitle>
              Цагийг
              <br />
              <em style={{ color: "#7a9e8e" }}>баталгаажуулах</em>
            </PageTitle>
          </div>
          <Card className="mb-4">
            <SectionLabel>Үйлчлүүлэгчийн сонгосон цаг</SectionLabel>
            <div className="flex items-center gap-4">
              <div className="text-3xl">📅</div>
              <div>
                <div
                  className="font-bold text-base"
                  style={{ color: "#2d2620" }}
                >
                  {confirmedSlot?.label}
                </div>
                <div className="text-sm" style={{ color: "#8a7968" }}>
                  {confirmedSlot?.time} — {confirmedEnd} (60 мин)
                </div>
              </div>
            </div>
          </Card>

          {/* Cancellation policy */}
          <Card className="mb-4">
            <SectionLabel>Миний төлбөрийн нөхцөл</SectionLabel>
            <div className="grid gap-4">
              {[
                {
                  label: "Цуцлах боломжтой хугацаа (цагаас өмнө)",
                  value: cancelHours,
                  set: setCancelHours,
                  min: 1,
                  max: 48,
                  unit: "цаг",
                },
                {
                  label: "Дахин товлох боломжтой хугацаа (цагаас өмнө)",
                  value: rescheduleHours,
                  set: setRescheduleHours,
                  min: 1,
                  max: 72,
                  unit: "цаг",
                },
                {
                  label: "Төлбөр хийх ёстой хугацаа (цагаас өмнө)",
                  value: paymentHoursBefore,
                  set: setPaymentHoursBefore,
                  min: 1,
                  max: 72,
                  unit: "цаг",
                },
              ].map(({ label, value, set, min, max, unit }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: "#8a7968" }}>
                      {label}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#8b6f52" }}
                    >
                      {value} {unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full accent-[#8b6f52]"
                  />
                </div>
              ))}
              <div className="rounded-xl p-3" style={{ background: "#f7f3ee" }}>
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "#8a7968" }}
                >
                  Буцаан олголтын дүрэм
                </p>
                <div className="grid gap-2">
                  {[
                    {
                      label: `Эхлэхээс ${noRefundHours} цагийн дотор цуцлавал`,
                      desc: "Төлбөр буцаахгүй",
                      color: "#e57373",
                      value: noRefundHours,
                      set: setNoRefundHours,
                    },
                    {
                      label: `Эхлэхээс ${refundHours}+ цагийн өмнө цуцлавал`,
                      desc: "Бүтэн төлбөр буцаана",
                      color: "#7a9e8e",
                      value: refundHours,
                      set: setRefundHours,
                    },
                  ].map(({ label, desc, color, value, set }) => (
                    <div
                      key={desc}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-xs" style={{ color: "#4a3f35" }}>
                          {label}
                        </div>
                        <div
                          className="text-xs font-semibold"
                          style={{ color }}
                        >
                          {desc}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => set((v) => Math.max(1, v - 1))}
                          className="w-6 h-6 rounded-full text-xs font-bold"
                          style={{ background: "#e8e0d5", color: "#8a7968" }}
                        >
                          -
                        </button>
                        <span
                          className="text-xs font-bold w-6 text-center"
                          style={{ color: "#2d2620" }}
                        >
                          {value}
                        </span>
                        <button
                          onClick={() => set((v) => v + 1)}
                          className="w-6 h-6 rounded-full text-xs font-bold"
                          style={{ background: "#e8e0d5", color: "#8a7968" }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <NotifBox title="Баталгаажилтын мэдэгдэл — Үйлчлүүлэгчид илгээгдэнэ">
            Таны цаг захиалга баталгаажлаа! 🎉<br />
            <strong>{t.name}</strong> — {confirmedSlot?.label},{" "}
            {confirmedSlot?.time}–{confirmedEnd}
            <br />
            Хэлбэр:{" "}
            <strong>
              {format === "online" ? "Онлайн видео дуудлага" : "Биечлэн"}
            </strong>
            <br />
            Төлбөр: <strong>{formatPrice(t.price)}</strong> — захиалгаас{" "}
            {paymentHoursBefore} цагийн өмнө хийнэ үү.
            <br />
            Цуцлах хугацаа: эхлэхээс <strong>{cancelHours} цагийн өмнө</strong>.
          </NotifBox>
          <Btn
            onClick={() => setBookingScreen("booking-confirmed")}
            variant="sage"
          >
            Баталгаажуулах ✓
          </Btn>
        </div>
      )

    // Confirmed
    if (bookingScreen === "booking-confirmed")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("therapist-confirm")}
            className="mb-6 flex items-center gap-2 text-sm text-[#8a7968]"
          >
            ← Буцах
          </button>
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "#e8f0ec" }}
            >
              ✓
            </div>
            <PageTitle>
              Цаг захиалга
              <br />
              <em style={{ color: "#7a9e8e" }}>баталгаажлаа!</em>
            </PageTitle>
            <p style={{ color: "#8a7968", fontSize: 14 }}>
              Дараах дэлгэрэнгүй мэдээллийг хадгалж аваарай
            </p>
          </div>
          <Card className="mb-4">
            <div className="flex items-center gap-4 mb-4">
              <Image
                    width={96}
                    height={96}
                src={t.photo}
                alt={t.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <div className="font-bold" style={{ color: "#2d2620" }}>
                  {t.name}
                </div>
                <div className="text-sm" style={{ color: "#8a7968" }}>
                  Сэтгэл зүйч
                </div>
              </div>
            </div>
            {[
              { icon: "📅", label: "Огноо", value: confirmedSlot?.label || "" },
              {
                icon: "🕐",
                label: "Цаг",
                value: `${confirmedSlot?.time} — ${confirmedEnd}`,
              },
              {
                icon: format === "online" ? "💻" : "🏢",
                label: "Хэлбэр",
                value:
                  format === "online" ? "Онлайн видео дуудлага" : "Биечлэн",
              },
              {
                icon: "💰",
                label: "Төлбөр",
                value: `${formatPrice(t.price)} — ${paymentHoursBefore} цагийн өмнө`,
              },
              {
                icon: "⏰",
                label: "Цуцлах",
                value: `Эхлэхээс ${cancelHours} цагийн өмнө`,
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: "1px solid #f0ebe4" }}
              >
                <span className="w-6 text-center">{icon}</span>
                <span className="text-sm flex-1" style={{ color: "#8a7968" }}>
                  {label}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#2d2620" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </Card>
          <div className="mb-6">
            <Btn onClick={() => setBookingScreen("payment-meeting")}>
              Төлбөр & уулзалтын холбоос →
            </Btn>
          </div>
        </div>
      )

    // Payment & meeting link
    if (bookingScreen === "payment-meeting")
      return (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setBookingScreen("booking-confirmed")}
            className="mb-6 flex items-center gap-2 text-sm text-[#8a7968]"
          >
            ← Буцах
          </button>
          <div className="text-center mb-6">
            <PageTitle>
              Төлбөр &<br />
              <em style={{ color: "#8b6f52" }}>уулзалтын холбоос</em>
            </PageTitle>
          </div>
          <Card className="mb-4">
            <SectionLabel>Төлбөр төлөх</SectionLabel>
            <p className="text-sm mb-4" style={{ color: "#8a7968" }}>
              Доорх аргуудаас сонгон төлбөрөө хийнэ үү.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setPaymentMethod("account-qr")}
                aria-pressed={paymentMethod === "account-qr"}
                className="relative rounded-2xl p-4 text-left transition-all"
                style={{
                  background:
                    paymentMethod === "account-qr" ? "#f0e8df" : "#f7f3ee",
                  border: `2px solid ${
                    paymentMethod === "account-qr" ? "#8b6f52" : "#e8e0d5"
                  }`,
                }}
              >
                {paymentMethod === "account-qr" && (
                  <span
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "#8b6f52" }}
                  >
                    ✓
                  </span>
                )}
                <span
                  className="mb-3 block text-sm font-bold"
                  style={{ color: "#2d2620" }}
                >
                  Дансны QR
                </span>
                <span className="mx-auto mb-3 flex w-fit rounded-xl bg-white p-3 shadow-sm">
                  <QRCodeSVG
                    value={PAYMENT_ACCOUNT_NUMBER}
                    size={156}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#2d2620"
                    title={`Дансны дугаар ${PAYMENT_ACCOUNT_NUMBER}`}
                  />
                </span>
                <span
                  className="block text-center text-xs mb-1"
                  style={{ color: "#8a7968" }}
                >
                  Дансны дугаар
                </span>
                <span
                  className="block break-all text-center text-sm font-bold tracking-wide"
                  style={{ color: "#2d2620" }}
                >
                  {PAYMENT_ACCOUNT_NUMBER}
                </span>
              </button>

              <button
                onClick={() => setPaymentMethod("socialpay")}
                aria-pressed={paymentMethod === "socialpay"}
                className="relative flex min-h-64 flex-col items-center justify-center rounded-2xl p-5 text-center transition-all"
                style={{
                  background:
                    paymentMethod === "socialpay" ? "#e8f0ec" : "#f7f3ee",
                  border: `2px solid ${
                    paymentMethod === "socialpay" ? "#7a9e8e" : "#e8e0d5"
                  }`,
                }}
              >
                {paymentMethod === "socialpay" && (
                  <span
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "#7a9e8e" }}
                  >
                    ✓
                  </span>
                )}
                <span
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
                  style={{ background: "#7a9e8e" }}
                >
                  SP
                </span>
                <span
                  className="mb-2 text-sm font-bold"
                  style={{ color: "#2d2620" }}
                >
                  SocialPay дугаар
                </span>
                <span
                  className="text-2xl font-bold tracking-wider"
                  style={{ color: "#8b6f52" }}
                >
                  {SOCIALPAY_NUMBER}
                </span>
                <span className="mt-3 text-xs" style={{ color: "#8a7968" }}>
                  SocialPay апп-аас шилжүүлнэ үү
                </span>
              </button>

              <button
                onClick={() => setPaymentMethod("qpay")}
                aria-pressed={paymentMethod === "qpay"}
                className="relative flex min-h-40 flex-col items-center justify-center rounded-2xl p-5 text-center transition-all"
                style={{
                  background:
                    paymentMethod === "qpay" ? "#f0e8df" : "#f7f3ee",
                  border: `2px solid ${
                    paymentMethod === "qpay" ? "#8b6f52" : "#e8e0d5"
                  }`,
                }}
              >
                {paymentMethod === "qpay" && (
                  <span
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "#8b6f52" }}
                  >
                    ✓
                  </span>
                )}
                <span
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
                  style={{ background: "#8b6f52" }}
                >
                  QP
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#2d2620" }}
                >
                  QPay
                </span>
              </button>

              <button
                onClick={() => setPaymentMethod("bank")}
                aria-pressed={paymentMethod === "bank"}
                className="relative flex min-h-40 flex-col items-center justify-center rounded-2xl p-5 text-center transition-all"
                style={{
                  background:
                    paymentMethod === "bank" ? "#e8f0ec" : "#f7f3ee",
                  border: `2px solid ${
                    paymentMethod === "bank" ? "#7a9e8e" : "#e8e0d5"
                  }`,
                }}
              >
                {paymentMethod === "bank" && (
                  <span
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "#7a9e8e" }}
                  >
                    ✓
                  </span>
                )}
                <span
                  className="mb-3 text-sm font-bold"
                  style={{ color: "#2d2620" }}
                >
                  Банкны шилжүүлэг
                </span>
                <span className="text-xs mb-1" style={{ color: "#8a7968" }}>
                  Дансны дугаар
                </span>
                <span
                  className="break-all text-sm font-bold tracking-wide"
                  style={{ color: "#8b6f52" }}
                >
                  {PAYMENT_ACCOUNT_NUMBER}
                </span>
              </button>

              <div
                className="rounded-xl px-4 py-3 flex justify-between items-center sm:col-span-2"
                style={{ background: "#f7f3ee" }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: "#2d2620" }}
                >
                  Нийт дүн
                </span>
                <span
                  className="text-base font-bold"
                  style={{ color: "#8b6f52" }}
                >
                  {formatPrice(PAYMENT_TOTAL)}
                </span>
              </div>
            </div>
          </Card>
          {format === "online" && (
            <Card className="mb-4">
              <SectionLabel>Уулзалтын холбоос илгээх эсэх?</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { val: true, label: "Тийм, илгээх", icon: "📹" },
                  { val: false, label: "Үгүй, илгээхгүй", icon: "✗" },
                ].map(({ val, label, icon }) => (
                  <button
                    key={String(val)}
                    onClick={() => setSendMeetingLink(val)}
                    className="py-3 rounded-xl flex flex-col items-center gap-1 text-sm font-medium transition-all"
                    style={{
                      background:
                        sendMeetingLink === val
                          ? val
                            ? "#7a9e8e"
                            : "#e8e0d5"
                          : "#f7f3ee",
                      color:
                        sendMeetingLink === val
                          ? val
                            ? "#fff"
                            : "#8a7968"
                          : "#2d2620",
                      border: `1.5px solid ${
                        sendMeetingLink === val
                          ? val
                            ? "#7a9e8e"
                            : "#c8a882"
                          : "#e8e0d5"
                      }`,
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              {sendMeetingLink === true && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "#e8f0ec",
                    border: "1.5px solid rgba(122,158,142,0.3)",
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: "#7a9e8e" }}
                  >
                    Автоматаар үүссэн уулзалтын холбоос
                  </p>
                  <p
                    className="text-xs font-mono mb-1"
                    style={{ color: "#2d2620" }}
                  >
                    🔗 meet.setgelzuich.mn/room/{t.id}-{confirmedSlot?.date}-
                    {confirmedSlot?.time?.replace(":", "")}
                  </p>
                  <p className="text-xs" style={{ color: "#8a7968" }}>
                    Эхлэх: {confirmedSlot?.label} {confirmedSlot?.time}{" "}
                    &nbsp;·&nbsp; Дуусах: {confirmedEnd}
                  </p>
                </div>
              )}
            </Card>
          )}
          <NotifBox title="Үйлчлүүлэгчид илгээгдэх эцсийн мэдэгдэл">
            Таны захиалга бүрэн баталгаажлаа! ✅<br />
            <strong>{t.name}</strong> — {confirmedSlot?.label},{" "}
            {confirmedSlot?.time}–{confirmedEnd}
            <br />
            {sendMeetingLink && format === "online" && (
              <>
                Уулзалтын холбоос: <em>meet.setgelzuich.mn/...</em>
                <br />
              </>
            )}
            Төлбөр: <strong>{formatPrice(PAYMENT_TOTAL)}</strong> — амжилттай
            хүлээн авлаа.
          </NotifBox>
          {bookingSaveError && (
            <p
              role="alert"
              className="mb-3 text-center text-sm font-semibold"
              style={{ color: "#c45c5c" }}
            >
              {bookingSaveError}
            </p>
          )}
          <Btn
            onClick={saveBooking}
            disabled={!paymentMethod || isSavingBooking}
            variant="primary"
          >
            {isSavingBooking
              ? "Хадгалж байна..."
              : paymentMethod
                ? "Дуусгах ✓"
                : "Төлбөрийн хэрэгсэл сонгоно уу"}
          </Btn>
        </div>
      )

    return null
  }

  const isBookingFlow = bookingScreen !== "match"

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: "rgb(255,255,255)",
        boxShadow: "rgba(0,0,0,0.25) 0px 4px 4px 0px",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <header
        className="w-full px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #f0ebe4" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "#8b6f52" }}
          >
            ✦
          </div>
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              color: "#2d2620",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Сэтгэлзүйч
          </span>
        </div>
        {isBookingFlow && t && (
          <div className="flex items-center gap-2">
            <Image
                    width={96}
                    height={96}
              src={t.photo}
              alt={t.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-sm font-medium" style={{ color: "#8a7968" }}>
              {t.name}
            </span>
          </div>
        )}
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-6">
        {isBookingFlow ? renderBooking() : renderMatchFlow()}
      </main>
    </div>
  )
}
