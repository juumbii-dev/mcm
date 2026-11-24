"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  registerTherapist,
  type TherapistSignupInput,
} from "@/app/(frontend)/therapist-signup/actions"

const steps = [
  { label: "Бүртгэл", hint: "Холбоо барих" },
  { label: "Туршлага", hint: "Боловсрол" },
  { label: "Мэргэшил", hint: "Үйлчилгээ" },
  { label: "Нөхцөл", hint: "Үнэ, байршил" },
  { label: "Лиценз", hint: "Заавал биш" },
  { label: "Профайл", hint: "Танилцуулга" },
]

const categories = [
  ["personal", "Хувь хүний зөвлөгөө"],
  ["couples", "Хосын зөвлөгөө"],
  ["teen", "Өсвөр насны зөвлөгөө"],
  ["family", "Хүүхдийн зөвлөгөө"],
  ["other", "Бусад"],
] as const

const specializations = [
  "Харилцааны бэрхшээл",
  "Амьдралын зорилго",
  "Ганцаардал / Тусгаарлагдал",
  "Өөрийгөө хайрлах",
  "Нийгмийн түгшүүр ба фоби",
  "Гэмтлийн дараах стресс (PTSD)",
  "Паник дарамт ба халдлага",
  "Стресс ба сэтгэлийн зовниул",
  "Донтолтоос гарах",
  "Гэр бүлийн зөрчил",
  "Алдагдал ба гашуудал",
  "Эцэг эхийн асуудал",
  "Урам зориг ба өөртөө итгэх",
  "Уур хилэн удирдах",
  "Ажил мэргэжлийн бэрхшээл",
  "Амьдралын өөрчлөлттэй зохицох",
  "Анхаарал ба ADHD",
]

const initialData: TherapistSignupInput = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  gender: "female",
  age: 30,
  professionalTitle: "Сэтгэл зүйч",
  experience: 0,
  school: "",
  degree: "",
  categories: [],
  specializations: [],
  formats: ["online"],
  calendlyURL: "",
  meetingProvider: "google-meet",
  chatAvailability: [
    { day: "monday", startTime: "18:00", endTime: "21:00" },
  ],
  price: 80000,
  bio: "",
  approach: "",
  languages: ["Монгол"],
  hasLicense: false,
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm font-bold text-[#3d332b]">
        <span>
          {label}
          {required && <span className="ml-1 text-[#9a5e45]">*</span>}
        </span>
        {hint && (
          <span className="font-normal text-[#8a7968]">{hint}</span>
        )}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  "w-full rounded-2xl border border-[#ded3c6] bg-white px-4 py-3.5 text-[15px] text-[#2d2620] outline-none transition placeholder:text-[#aa9c8e] focus:border-[#7a9e8e] focus:ring-4 focus:ring-[#7a9e8e]/10"

function ToggleCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean
  onClick: () => void
  title: string
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#7a9e8e] bg-[#edf4f0] shadow-[0_0_0_3px_rgba(122,158,142,0.09)]"
          : "border-[#ded3c6] bg-white hover:border-[#bda98f]"
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            active
              ? "border-[#648879] bg-[#648879] text-white"
              : "border-[#b9aa9c]"
          }`}
        >
          {active && (
            <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
              <path
                d="m4.5 10 3.2 3.2 7.8-7.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span>
          <span className="block font-bold text-[#2d2620]">{title}</span>
          {description && (
            <span className="mt-1 block text-sm leading-5 text-[#7d6f63]">
              {description}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

export default function TherapistSignup() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const progress = ((step + 1) / steps.length) * 100
  const initials = useMemo(
    () =>
      data.fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "ЗӨ",
    [data.fullName],
  )

  const update = <K extends keyof TherapistSignupInput>(
    key: K,
    value: TherapistSignupInput[K],
  ) => setData((current) => ({ ...current, [key]: value }))

  const toggle = (
    key: "categories" | "specializations" | "formats",
    value: string,
  ) => {
    const values = data[key]
    update(
      key,
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    )
  }

  const validateStep = () => {
    if (
      step === 0 &&
      (!data.fullName ||
        !data.email ||
        !data.phone ||
        data.password.length < 8 ||
        data.age < 25 ||
        data.age > 90)
    ) {
      return "Нэр, имэйл, утас болон 8-аас дээш тэмдэгттэй нууц үгээ оруулна уу."
    }
    if (
      step === 1 &&
      (!data.professionalTitle || !data.school || !data.degree)
    ) {
      return "Мэргэжлийн нэр болон боловсролын мэдээллээ бүрэн оруулна уу."
    }
    if (
      step === 2 &&
      (!data.categories.length || !data.specializations.length)
    ) {
      return "Дор хаяж нэг үйлчилгээ, нэг мэргэшлийн чиглэл сонгоно уу."
    }
    if (
      step === 3 &&
      (!data.formats.length ||
        data.price < 0 ||
        (data.formats.includes("online") &&
          data.chatAvailability.length === 0) ||
        (data.formats.includes("inperson") && !data.aimag))
    ) {
      return "Уулзалтын хэлбэр, үнэ болон шаардлагатай байршлыг оруулна уу."
    }
    if (
      step === 4 &&
      data.hasLicense &&
      (!data.licenseNumber || !data.licenseIssuer)
    ) {
      return "Лиценз нэмэх бол дугаар, олгосон байгууллагыг оруулна уу."
    }
    if (step === 5 && data.bio.trim().length < 80) {
      return "Профайлын танилцуулгыг хамгийн багадаа 80 тэмдэгтээр бичнэ үү."
    }
    return ""
  }

  const next = () => {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }
    setError("")
    setStep((current) => Math.min(current + 1, steps.length - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const submit = async () => {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }
    setSubmitting(true)
    setError("")
    const result = await registerTherapist(data)
    if (result.ok) {
      router.push("/therapist/profile")
      router.refresh()
      return
    }
    setError(result.message)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-[#2d2620]">
      <header className="border-b border-[#e7ddd2] bg-[#fbf8f4]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7d634a] text-lg text-white">
              S
            </span>
            <span className="font-display text-xl font-semibold">
              Сэтгэлзүйч
            </span>
          </Link>
          <div className="text-sm text-[#76685b]">
            Бүртгэлтэй юу?{" "}
            <Link
              href="/therapist-login"
              className="font-bold text-[#55796a] hover:underline"
            >
              Нэвтрэх
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[260px_1fr] lg:py-12">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8b6f52]">
            Зөвлөхийн onboarding
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight">
            Таны туршлага,
            <br />
            таны профайл
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#7d6f63]">
            Мэдээллээ алхам алхмаар оруулаарай. Илгээсний дараа манай баг
            профайлыг хянаж, сайтад идэвхтэй харагдах эсэхийг баталгаажуулна.
          </p>

          <div className="mt-7 hidden space-y-1 lg:block">
            {steps.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  index === step
                    ? "bg-white shadow-sm"
                    : index < step
                      ? "text-[#55796a]"
                      : "text-[#a09387]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    index <= step
                      ? "bg-[#dfece6] text-[#55796a]"
                      : "bg-[#ebe4dc] text-[#998b7e]"
                  }`}
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-xs opacity-75">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-[#dfd1c2] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a9e8e]">
              Гишүүнчлэлийн нөхцөл
            </p>
            <p className="mt-3 font-display text-2xl font-semibold">
              Эхний 6 сар үнэгүй
            </p>
            <p className="mt-1 text-sm leading-6 text-[#7d6f63]">
              7 дахь сараас эхлэн сарын 10,000₮. Эхний зургаан сарын хугацаанд
              төлбөр төлөхгүй.
            </p>
            <div className="mt-4 border-t border-[#eee5dc] pt-4">
              <p className="text-xs font-bold text-[#6f543c]">
                Гишүүнчлэлд багтана
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#66594f]">
                {[
                  "Share office ашиглах",
                  "Share meeting room захиалах",
                  "Сэтгэл зүйн тестийн сан",
                  "Ажлын материал, нөөцүүд",
                ].map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <span className="font-bold text-[#7a9e8e]">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main>
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-sm font-bold text-[#55796a]">
              {step + 1} / {steps.length}
            </span>
            <span className="text-sm text-[#7d6f63]">{steps[step].label}</span>
          </div>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#e4dbd1]">
            <div
              className="h-full rounded-full bg-[#7a9e8e] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <section className="overflow-hidden rounded-[28px] border border-[#e6dbcf] bg-white shadow-[0_24px_80px_rgba(74,58,45,0.08)]">
            <div className="border-b border-[#eee5dc] px-6 py-6 sm:px-10 sm:py-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9e8e]">
                {steps[step].hint}
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                {step === 0 && "Эхлээд тантай танилцъя"}
                {step === 1 && "Мэргэжлийн туршлага"}
                {step === 2 && "Хэнд, юугаар тусалдаг вэ?"}
                {step === 3 && "Үйлчилгээний нөхцөл"}
                {step === 4 && "Лицензийн мэдээлэл"}
                {step === 5 && "Нийтэд харагдах профайл"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d6f63]">
                {step === 0 &&
                  "Энэ мэдээлэл таны account үүсгэх болон бүртгэлийн явцыг мэдэгдэхэд ашиглагдана."}
                {step === 1 &&
                  "Үйлчлүүлэгчид таны боловсрол, туршлагыг хараад итгэлтэй сонголт хийнэ."}
                {step === 2 &&
                  "Оновчтой сонголтууд нь хэрэглэгчтэй илүү сайн тохируулахад тусална."}
                {step === 3 &&
                  "Онлайн, биечлэн эсвэл хоёуланг нь санал болгож болно."}
                {step === 4 &&
                  "Лицензгүй эсвэл дараа нь нэмэх бол энэ алхмыг алгасаж болно."}
                {step === 5 &&
                  "Таны өнгө аяс, арга барилыг ойлгомжтой илэрхийлэх эцсийн алхам."}
              </p>
            </div>

            <div className="px-6 py-7 sm:px-10 sm:py-9">
              {step === 0 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Овог нэр" required>
                      <input
                        className={inputClass}
                        value={data.fullName}
                        onChange={(event) =>
                          update("fullName", event.target.value)
                        }
                        placeholder="Жишээ: Д. Нарантуяа"
                        autoComplete="name"
                      />
                    </Field>
                  </div>
                  <Field label="Имэйл хаяг" required>
                    <input
                      type="email"
                      className={inputClass}
                      value={data.email}
                      onChange={(event) => update("email", event.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Утасны дугаар" required>
                    <input
                      className={inputClass}
                      value={data.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      placeholder="9911 2233"
                      autoComplete="tel"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label="Нууц үг"
                      required
                      hint="8-аас дээш тэмдэгт"
                    >
                      <input
                        type="password"
                        className={inputClass}
                        value={data.password}
                        onChange={(event) =>
                          update("password", event.target.value)
                        }
                        autoComplete="new-password"
                      />
                    </Field>
                  </div>
                  <Field label="Хүйс" required>
                    <select
                      className={inputClass}
                      value={data.gender}
                      onChange={(event) =>
                        update(
                          "gender",
                          event.target.value as TherapistSignupInput["gender"],
                        )
                      }
                    >
                      <option value="female">Эмэгтэй</option>
                      <option value="male">Эрэгтэй</option>
                      <option value="other">Бусад</option>
                    </select>
                  </Field>
                  <Field label="Нас" required>
                    <input
                      type="number"
                      min="25"
                      max="90"
                      className={inputClass}
                      value={data.age}
                      onChange={(event) =>
                        update("age", Number(event.target.value))
                      }
                    />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Мэргэжлийн нэр" required>
                      <input
                        className={inputClass}
                        value={data.professionalTitle}
                        onChange={(event) =>
                          update("professionalTitle", event.target.value)
                        }
                        placeholder="Сэтгэл зүйч, гэр бүл судлаач"
                      />
                    </Field>
                  </div>
                  <Field label="Туршлагын жил" required>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className={inputClass}
                      value={data.experience}
                      onChange={(event) =>
                        update("experience", Number(event.target.value))
                      }
                    />
                  </Field>
                  <Field label="Төгссөн он">
                    <input
                      type="number"
                      min="1960"
                      max="2035"
                      className={inputClass}
                      value={data.graduationYear ?? ""}
                      onChange={(event) =>
                        update(
                          "graduationYear",
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      placeholder="2018"
                    />
                  </Field>
                  <Field label="Сургууль" required>
                    <input
                      className={inputClass}
                      value={data.school}
                      onChange={(event) => update("school", event.target.value)}
                      placeholder="Сургуулийн нэр"
                    />
                  </Field>
                  <Field label="Зэрэг, хөтөлбөр" required>
                    <input
                      className={inputClass}
                      value={data.degree}
                      onChange={(event) => update("degree", event.target.value)}
                      placeholder="Сэтгэл судлалын магистр"
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-3 text-sm font-bold">
                      Зөвлөгөөний төрөл
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {categories.map(([value, label]) => (
                        <ToggleCard
                          key={value}
                          active={data.categories.includes(value)}
                          onClick={() => toggle("categories", value)}
                          title={label}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-end justify-between">
                      <h3 className="text-sm font-bold">
                        Мэргэшлийн чиглэл
                      </h3>
                      <span className="text-xs text-[#8a7968]">
                        {data.specializations.length} сонгосон
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggle("specializations", value)}
                          className={`rounded-full border px-3.5 py-2 text-sm transition ${
                            data.specializations.includes(value)
                              ? "border-[#7a9e8e] bg-[#e8f0ec] font-bold text-[#55796a]"
                              : "border-[#ded3c6] text-[#66594f] hover:border-[#bda98f]"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-7">
                  <div>
                    <h3 className="mb-3 text-sm font-bold">
                      Уулзалтын хэлбэр
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToggleCard
                        active={data.formats.includes("online")}
                        onClick={() => toggle("formats", "online")}
                        title="Онлайн"
                        description="Видео уулзалтаар, хаанаас ч холбогдоно"
                      />
                      <ToggleCard
                        active={data.formats.includes("inperson")}
                        onClick={() => toggle("formats", "inperson")}
                        title="Биечлэн"
                        description="Зөвлөгөөний өрөөнд уулзана"
                      />
                    </div>
                  </div>
                  <Field label="60 минутын үнэ" required hint="₮">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      className={inputClass}
                      value={data.price}
                      onChange={(event) =>
                        update("price", Number(event.target.value))
                      }
                    />
                  </Field>
                  {data.formats.includes("online") && (
                    <div className="grid gap-5 rounded-2xl border border-[#d7e3dd] bg-[#f0f6f3] p-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <p className="text-sm font-bold text-[#46675a]">
                          Онлайн цаг захиалга
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#657b72]">
                          Calendly дээр боломжит цагаа тохируулна. Үйлчлүүлэгч
                          цаг сонгоход Google Meet эсвэл Zoom холбоос автоматаар
                          очно.
                        </p>
                      </div>
                      <Field
                        label="Calendly холбоос"
                        hint="Заавал биш"
                      >
                        <input
                          type="url"
                          className={inputClass}
                          value={data.calendlyURL ?? ""}
                          onChange={(event) =>
                            update("calendlyURL", event.target.value)
                          }
                          placeholder="https://calendly.com/your-name"
                        />
                      </Field>
                      <Field label="Уулзалтын хэрэгсэл">
                        <select
                          className={inputClass}
                          value={data.meetingProvider}
                          onChange={(event) =>
                            update(
                              "meetingProvider",
                              event.target
                                .value as TherapistSignupInput["meetingProvider"],
                            )
                          }
                        >
                          <option value="google-meet">Google Meet</option>
                          <option value="zoom">Zoom</option>
                        </select>
                      </Field>
                      <div className="sm:col-span-2">
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-[#46675a]">
                              Чатлах, уулзах боломжтой өдөр, цаг
                            </p>
                            <p className="mt-1 text-xs text-[#657b72]">
                              Үйлчлүүлэгч зөвлөх хайхдаа энэ хуваариар шүүнэ.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              update("chatAvailability", [
                                ...data.chatAvailability,
                                {
                                  day: "monday",
                                  startTime: "18:00",
                                  endTime: "21:00",
                                },
                              ])
                            }
                            className="shrink-0 rounded-full border border-[#9ab8aa] bg-white px-3 py-2 text-xs font-bold text-[#46675a]"
                          >
                            + Цаг нэмэх
                          </button>
                        </div>
                        <div className="space-y-2">
                          {data.chatAvailability.map((slot, index) => (
                            <div
                              key={`${slot.day}-${index}`}
                              className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_90px_90px_36px]"
                            >
                              <select
                                value={slot.day}
                                onChange={(event) => {
                                  const next = [...data.chatAvailability]
                                  next[index] = {
                                    ...slot,
                                    day: event.target
                                      .value as TherapistSignupInput["chatAvailability"][number]["day"],
                                  }
                                  update("chatAvailability", next)
                                }}
                                className={inputClass}
                              >
                                {[
                                  ["monday", "Даваа"],
                                  ["tuesday", "Мягмар"],
                                  ["wednesday", "Лхагва"],
                                  ["thursday", "Пүрэв"],
                                  ["friday", "Баасан"],
                                  ["saturday", "Бямба"],
                                  ["sunday", "Ням"],
                                ].map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(event) => {
                                  const next = [...data.chatAvailability]
                                  next[index] = {
                                    ...slot,
                                    startTime: event.target.value,
                                  }
                                  update("chatAvailability", next)
                                }}
                                className={inputClass}
                              />
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(event) => {
                                  const next = [...data.chatAvailability]
                                  next[index] = {
                                    ...slot,
                                    endTime: event.target.value,
                                  }
                                  update("chatAvailability", next)
                                }}
                                className={inputClass}
                              />
                              <button
                                type="button"
                                aria-label="Цагийн мөр устгах"
                                onClick={() =>
                                  update(
                                    "chatAvailability",
                                    data.chatAvailability.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                                className="rounded-xl border border-[#d8c9bc] bg-white text-lg text-[#98614b] max-sm:col-span-2"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2 grid gap-2 sm:grid-cols-3">
                        {[
                          ["1", "Calendly", "Цаг сонгоно"],
                          ["2", "Meet / Zoom", "Линк автоматаар очно"],
                          ["3", "QPay", "QR-аар төлнө"],
                        ].map(([number, title, description]) => (
                          <div
                            key={number}
                            className="rounded-xl bg-white px-3 py-3"
                          >
                            <span className="text-xs font-bold text-[#7a9e8e]">
                              {number}
                            </span>
                            <p className="mt-1 text-sm font-bold text-[#3d554b]">
                              {title}
                            </p>
                            <p className="text-xs text-[#72827b]">
                              {description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.formats.includes("inperson") && (
                    <div className="grid gap-5 rounded-2xl bg-[#f8f4ef] p-5 sm:grid-cols-2">
                      <Field label="Хот / аймаг" required>
                        <input
                          className={inputClass}
                          value={data.aimag ?? ""}
                          onChange={(event) =>
                            update("aimag", event.target.value)
                          }
                          placeholder="Улаанбаатар"
                        />
                      </Field>
                      <Field label="Дүүрэг / сум">
                        <input
                          className={inputClass}
                          value={data.district ?? ""}
                          onChange={(event) =>
                            update("district", event.target.value)
                          }
                          placeholder="Сүхбаатар"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Хаягийн тайлбар">
                          <input
                            className={inputClass}
                            value={data.address ?? ""}
                            onChange={(event) =>
                              update("address", event.target.value)
                            }
                            placeholder="Дэлгэрэнгүй хаяг"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#d7e3dd] bg-[#f0f6f3] p-5 text-sm leading-6 text-[#526b61]">
                    Лицензийн мэдээлэл одоогоор заавал биш. Та лицензгүй бол
                    шууд дараагийн алхам руу орж, профайл баталгаажуулах явцад
                    дараа нь нэмж болно.
                  </div>
                  <ToggleCard
                    active={data.hasLicense}
                    onClick={() => update("hasLicense", !data.hasLicense)}
                    title="Лицензийн мэдээлэл нэмэх"
                    description="Дугаар, олгосон байгууллага, хүчинтэй хугацааг бүртгэнэ"
                  />
                  {data.hasLicense && (
                    <div className="grid gap-5 rounded-2xl border border-[#e5dbd1] p-5 sm:grid-cols-2">
                      <Field label="Лицензийн дугаар" required>
                        <input
                          className={inputClass}
                          value={data.licenseNumber ?? ""}
                          onChange={(event) =>
                            update("licenseNumber", event.target.value)
                          }
                        />
                      </Field>
                      <Field label="Олгосон байгууллага" required>
                        <input
                          className={inputClass}
                          value={data.licenseIssuer ?? ""}
                          onChange={(event) =>
                            update("licenseIssuer", event.target.value)
                          }
                        />
                      </Field>
                      <Field label="Хүчинтэй хугацаа">
                        <input
                          type="date"
                          className={inputClass}
                          value={data.licenseExpiresAt ?? ""}
                          onChange={(event) =>
                            update("licenseExpiresAt", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                  <div className="space-y-5">
                    <Field
                      label="Өөрийн тухай"
                      required
                      hint={`${data.bio.length}/2000`}
                    >
                      <textarea
                        rows={7}
                        maxLength={2000}
                        className={`${inputClass} resize-none`}
                        value={data.bio}
                        onChange={(event) => update("bio", event.target.value)}
                        placeholder="Та хэнтэй, ямар сэдвээр ажилладаг, үйлчлүүлэгч тань уулзалтаас юу хүлээж болохыг дулаан, ойлгомжтой хэлээр бичээрэй..."
                      />
                    </Field>
                    <Field label="Ажиллах арга барил" hint="Заавал биш">
                      <textarea
                        rows={4}
                        className={`${inputClass} resize-none`}
                        value={data.approach}
                        onChange={(event) =>
                          update("approach", event.target.value)
                        }
                        placeholder="Жишээ: CBT, шийдэлд төвлөрсөн арга, mindfulness..."
                      />
                    </Field>
                    <Field
                      label="Зөвлөгөө өгөх хэл"
                      hint="Таслалаар тусгаарлана"
                    >
                      <input
                        className={inputClass}
                        value={data.languages.join(", ")}
                        onChange={(event) =>
                          update(
                            "languages",
                            event.target.value
                              .split(",")
                              .map((value) => value.trim()),
                          )
                        }
                      />
                    </Field>
                  </div>

                  <aside className="rounded-3xl bg-[#f5efe8] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8b6f52]">
                      Профайл урьдчилан харах
                    </p>
                    <div className="mt-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7a9e8e] font-display text-2xl font-semibold text-white">
                      {initials}
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold">
                      {data.fullName || "Таны нэр"}
                    </h3>
                    <p className="mt-1 text-sm text-[#7d6f63]">
                      {data.professionalTitle}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {data.specializations.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white px-2.5 py-1 text-xs text-[#55796a]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <dl className="mt-5 space-y-3 border-t border-[#dfd1c2] pt-4 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-[#7d6f63]">Туршлага</dt>
                        <dd className="font-bold">{data.experience} жил</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#7d6f63]">Үнэ</dt>
                        <dd className="font-bold">
                          {data.price.toLocaleString("mn-MN")}₮
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#7d6f63]">Хэлбэр</dt>
                        <dd className="font-bold">
                          {data.formats.length === 2
                            ? "Хосолсон"
                            : data.formats[0] === "online"
                              ? "Онлайн"
                              : "Биечлэн"}
                        </dd>
                      </div>
                    </dl>
                  </aside>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-[#e8c8bb] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[#8d4e39]"
                >
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#eee5dc] bg-[#fcfaf8] px-6 py-5 sm:px-10">
              <button
                type="button"
                onClick={() => {
                  setError("")
                  if (step === 0) {
                    router.push("/")
                    return
                  }
                  setStep((current) => Math.max(0, current - 1))
                }}
                disabled={submitting}
                className="rounded-full px-5 py-3 text-sm font-bold text-[#76685b] transition hover:bg-[#eee7df] disabled:opacity-50"
              >
                {step === 0 ? "Нүүр рүү буцах" : "Буцах"}
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full bg-[#735b45] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#604a38]"
                >
                  Үргэлжлүүлэх
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="rounded-full bg-[#55796a] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#46675a] disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Хадгалж байна..." : "Профайлаа илгээх"}
                </button>
              )}
            </div>
          </section>
          <p className="mt-5 text-center text-xs leading-5 text-[#8a7968]">
            Үргэлжлүүлснээр та платформын үйлчилгээний нөхцөл болон нууцлалын
            бодлогыг зөвшөөрнө.
          </p>
        </main>
      </div>
    </div>
  )
}
