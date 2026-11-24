"use server"

import { therapistAuth } from "@/lib/app-auth"
import {
  legacyAuth,
  legacyAuthenticatedRequest,
} from "@/lib/legacy-api"

export type TherapistSignupInput = {
  fullName: string
  email: string
  phone: string
  password: string
  gender: "female" | "male" | "other"
  age: number
  professionalTitle: string
  experience: number
  school: string
  degree: string
  graduationYear?: number
  categories: string[]
  specializations: string[]
  formats: string[]
  calendlyURL?: string
  meetingProvider: "google-meet" | "zoom"
  chatAvailability: {
    day:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday"
    startTime: string
    endTime: string
  }[]
  price: number
  aimag?: string
  district?: string
  address?: string
  bio: string
  approach?: string
  languages: string[]
  hasLicense: boolean
  licenseNumber?: string
  licenseIssuer?: string
  licenseExpiresAt?: string
}

export type SignupResult =
  | { ok: true }
  | { ok: false; field?: string; message: string }

const categoryValues = new Set([
  "personal",
  "couples",
  "teen",
  "family",
  "other",
])
const formatValues = new Set(["online", "inperson"])
const dayValues = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])
const specializationValues = new Set([
  "Харилцааны бэрхшээл",
  "Амьдралын зорилго",
  "Ганцаардал / Тусгаарлагдал",
  "Өөрийгөө хайрлах",
  "Нийгмийн түгшүүр ба фоби",
  "Буруутгал ба ичгүүр",
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
])

const cleanText = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

export async function registerTherapist(
  input: TherapistSignupInput,
): Promise<SignupResult> {
  const fullName = cleanText(input.fullName, 120)
  const email = cleanText(input.email, 180).toLowerCase()
  const phone = cleanText(input.phone, 30)
  const password = typeof input.password === "string" ? input.password : ""
  const professionalTitle = cleanText(input.professionalTitle, 140)
  const school = cleanText(input.school, 180)
  const degree = cleanText(input.degree, 180)
  const bio = cleanText(input.bio, 2000)
  const approach = cleanText(input.approach, 1200)
  const experience = Number(input.experience)
  const age = Number(input.age)
  const price = Number(input.price)
  const calendlyURL = cleanText(input.calendlyURL, 300)
  const chatAvailability = Array.isArray(input.chatAvailability)
    ? input.chatAvailability
        .map((slot) => ({
          day: cleanText(slot?.day, 16),
          startTime: cleanText(slot?.startTime, 5),
          endTime: cleanText(slot?.endTime, 5),
        }))
        .filter(
          (slot) =>
            dayValues.has(slot.day) &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.startTime) &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.endTime) &&
            slot.startTime < slot.endTime,
        )
        .slice(0, 14)
    : []
  const categories = Array.isArray(input.categories)
    ? input.categories.filter((value): value is "personal" | "couples" | "teen" | "family" | "other" =>
        categoryValues.has(value),
      )
    : []
  const formats = Array.isArray(input.formats)
    ? input.formats.filter((value): value is "online" | "inperson" =>
        formatValues.has(value),
      )
    : []
  const specializations = Array.isArray(input.specializations)
    ? input.specializations.filter(
        (value): value is
          | "Харилцааны бэрхшээл"
          | "Амьдралын зорилго"
          | "Ганцаардал / Тусгаарлагдал"
          | "Өөрийгөө хайрлах"
          | "Нийгмийн түгшүүр ба фоби"
          | "Буруутгал ба ичгүүр"
          | "Гэмтлийн дараах стресс (PTSD)"
          | "Паник дарамт ба халдлага"
          | "Стресс ба сэтгэлийн зовниул"
          | "Донтолтоос гарах"
          | "Гэр бүлийн зөрчил"
          | "Алдагдал ба гашуудал"
          | "Эцэг эхийн асуудал"
          | "Урам зориг ба өөртөө итгэх"
          | "Уур хилэн удирдах"
          | "Ажил мэргэжлийн бэрхшээл"
          | "Амьдралын өөрчлөлттэй зохицох"
          | "Анхаарал ба ADHD" => specializationValues.has(value),
      )
    : []
  const languages = Array.isArray(input.languages)
    ? input.languages
        .map((value) => cleanText(value, 40))
        .filter(Boolean)
        .slice(0, 6)
    : []

  if (!fullName) {
    return { ok: false, field: "fullName", message: "Нэрээ оруулна уу." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, field: "email", message: "Имэйл хаягаа шалгана уу." }
  }
  if (password.length < 8 || password.length > 72) {
    return {
      ok: false,
      field: "password",
      message: "Нууц үг хамгийн багадаа 8 тэмдэгт байна.",
    }
  }
  if (
    !["female", "male", "other"].includes(input.gender) ||
    !Number.isFinite(age) ||
    age < 25 ||
    age > 90
  ) {
    return {
      ok: false,
      field: "age",
      message: "Хүйс, насны мэдээллээ шалгана уу.",
    }
  }
  if (!professionalTitle || !school || !degree) {
    return {
      ok: false,
      field: "professionalTitle",
      message: "Мэргэжил болон боловсролын мэдээллээ бүрэн оруулна уу.",
    }
  }
  if (!Number.isFinite(experience) || experience < 0 || experience > 60) {
    return {
      ok: false,
      field: "experience",
      message: "Туршлагын жилээ шалгана уу.",
    }
  }
  if (!categories.length || !specializations.length || !formats.length) {
    return {
      ok: false,
      field: "specializations",
      message: "Үйлчилгээ, мэргэшил, уулзалтын хэлбэрээ сонгоно уу.",
    }
  }
  if (!Number.isFinite(price) || price < 0 || price > 2_000_000) {
    return { ok: false, field: "price", message: "Үнийн дүнгээ шалгана уу." }
  }
  if (calendlyURL) {
    try {
      const url = new URL(calendlyURL)
      if (
        url.protocol !== "https:" ||
        (url.hostname !== "calendly.com" &&
          !url.hostname.endsWith(".calendly.com"))
      ) {
        throw new Error("invalid")
      }
    } catch {
      return {
        ok: false,
        field: "calendlyURL",
        message: "https://calendly.com/... хэлбэрийн холбоос оруулна уу.",
      }
    }
  }
  if (!["google-meet", "zoom"].includes(input.meetingProvider)) {
    return {
      ok: false,
      field: "meetingProvider",
      message: "Онлайн уулзалтын хэрэгслээ сонгоно уу.",
    }
  }
  if (formats.includes("online") && chatAvailability.length === 0) {
    return {
      ok: false,
      field: "chatAvailability",
      message: "Онлайн үйлчилгээний чатлах боломжтой өдөр, цагаас нэмнэ үү.",
    }
  }
  if (bio.length < 80) {
    return {
      ok: false,
      field: "bio",
      message: "Танилцуулга хамгийн багадаа 80 тэмдэгт байна.",
    }
  }
  if (formats.includes("inperson") && !cleanText(input.aimag, 80)) {
    return {
      ok: false,
      field: "aimag",
      message: "Биечлэн үйлчилгээний байршлыг оруулна уу.",
    }
  }
  if (
    input.hasLicense &&
    (!cleanText(input.licenseNumber, 100) ||
      !cleanText(input.licenseIssuer, 180))
  ) {
    return {
      ok: false,
      field: "licenseNumber",
      message: "Лиценз нэмэх бол дугаар, олгосон байгууллагыг оруулна уу.",
    }
  }

  try {
    await legacyAuth("register", {
      name: fullName,
      email,
      password,
      phone,
      role: "counselor",
      bio,
      experience,
      expertise: specializations.join(", "),
      qualifications: `${degree} - ${school}`,
      city: cleanText(input.aimag, 80),
      age,
      gender: input.gender,
    })

    const user = await therapistAuth.login(email, password)
    if (!user.psychologistId) {
      throw new Error("Counselor profile was not created")
    }

    await legacyAuthenticatedRequest(`/psychologists/${user.psychologistId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: fullName,
        specialty: professionalTitle,
        focus: approach || bio,
        gender: input.gender,
        age,
        specializations,
        categories,
        sessionFormats: formats,
        price,
        experience,
        aimag: cleanText(input.aimag, 80),
        district: cleanText(input.district, 80),
        address: cleanText(input.address, 180),
        bio,
        approach,
        languages,
        calendlyURL,
        meetingProvider: input.meetingProvider,
        chatAvailability,
        licenseNumber: input.hasLicense
          ? cleanText(input.licenseNumber, 100)
          : "",
        licenseIssuer: input.hasLicense
          ? cleanText(input.licenseIssuer, 180)
          : "",
        licenseExpiresAt: input.hasLicense
          ? cleanText(input.licenseExpiresAt, 30)
          : "",
        school,
        degree,
        graduationYear: input.graduationYear,
      }),
    })

    return { ok: true }
  } catch (error) {
    const message =
      error instanceof Error && /email|unique|duplicate/i.test(error.message)
        ? "Энэ имэйл хаягаар бүртгэл үүссэн байна."
        : "Бүртгэлийг хадгалж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу."
    return { ok: false, message }
  }
}

export async function loginTherapist(
  _previous: SignupResult | null,
  formData: FormData,
): Promise<SignupResult> {
  const email = cleanText(formData.get("email"), 180).toLowerCase()
  const password = String(formData.get("password") ?? "")
  try {
    await therapistAuth.login(email, password)
    return { ok: true }
  } catch {
    return { ok: false, message: "Имэйл эсвэл нууц үг буруу байна." }
  }
}

export async function logoutTherapist() {
  await therapistAuth.logout()
}
