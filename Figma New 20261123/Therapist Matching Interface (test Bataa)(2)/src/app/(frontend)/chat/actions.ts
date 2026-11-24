"use server"

import { therapistAuth } from "@/lib/app-auth"
import {
  legacyAuth,
  legacyAuthenticatedRequest,
} from "@/lib/legacy-api"

export type ChatActionState = {
  ok: boolean
  message: string
  conversationId?: string
}

const clean = (value: FormDataEntryValue | null, max = 2000) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

export async function registerClient(
  _previous: ChatActionState | null,
  formData: FormData,
): Promise<ChatActionState> {
  const fullName = clean(formData.get("fullName"), 120)
  const email = clean(formData.get("email"), 180).toLowerCase()
  const password = clean(formData.get("password"), 72)
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Нэр, имэйл хаягаа шалгана уу." }
  }
  if (password.length < 8) {
    return { ok: false, message: "Нууц үг 8-аас дээш тэмдэгт байна." }
  }

  try {
    await legacyAuth("register", {
      name: fullName,
      email,
      password,
      role: "client",
    })
    await therapistAuth.login(email, password)
    return { ok: true, message: "Бүртгэл амжилттай." }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && /email|unique|duplicate/i.test(error.message)
          ? "Энэ имэйлээр бүртгэл үүссэн байна."
          : "Бүртгэл үүсгэж чадсангүй.",
    }
  }
}

export async function loginClient(
  _previous: ChatActionState | null,
  formData: FormData,
): Promise<ChatActionState> {
  try {
    const user = await therapistAuth.login(
      clean(formData.get("email"), 180).toLowerCase(),
      clean(formData.get("password"), 72),
    )
    if (user.accountType !== "client") {
      await therapistAuth.logout()
      return {
        ok: false,
        message: "Энэ хэсэгт үйлчлүүлэгчийн эрхээр нэвтэрнэ үү.",
      }
    }
    return { ok: true, message: "Амжилттай нэвтэрлээ." }
  } catch {
    return { ok: false, message: "Имэйл эсвэл нууц үг буруу байна." }
  }
}

export async function logoutChatUser() {
  await therapistAuth.logout()
}

export async function startConversation(
  therapistID: string,
): Promise<ChatActionState> {
  const user = await therapistAuth.currentUser()
  if (!user || user.accountType !== "client") {
    return { ok: false, message: "Үйлчлүүлэгчийн эрхээр нэвтэрнэ үү." }
  }
  try {
    const result = await legacyAuthenticatedRequest<{
      conversation: { id: number }
    }>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({
        therapistId: Number(therapistID),
        clientId: user.id,
      }),
    })
    return {
      ok: true,
      message: "Чат үүслээ.",
      conversationId: String(result.conversation.id),
    }
  } catch {
    return {
      ok: false,
      message: "Энэ зөвлөхтэй чат эхлүүлж чадсангүй.",
    }
  }
}

export async function sendChatMessage(
  _previous: ChatActionState | null,
  formData: FormData,
): Promise<ChatActionState> {
  const user = await therapistAuth.currentUser()
  if (!user) return { ok: false, message: "Дахин нэвтэрнэ үү." }
  const conversation = clean(formData.get("conversation"), 100)
  const body = clean(formData.get("body"), 2000)
  if (!conversation || !body) {
    return { ok: false, message: "Мессежээ бичнэ үү." }
  }
  try {
    await legacyAuthenticatedRequest(`/chat/conversations/${conversation}`, {
      method: "POST",
      body: JSON.stringify({ body }),
    })
    return { ok: true, message: "Илгээгдлээ." }
  } catch {
    return { ok: false, message: "Мессеж илгээж чадсангүй." }
  }
}

export async function submitChatFeedback(
  _previous: ChatActionState | null,
  formData: FormData,
): Promise<ChatActionState> {
  const user = await therapistAuth.currentUser()
  if (!user || user.accountType !== "client") {
    return { ok: false, message: "Үйлчлүүлэгчийн эрхээр нэвтэрнэ үү." }
  }
  const rating = Number(formData.get("rating"))
  const comment = clean(formData.get("comment"), 1500)
  const therapist = clean(formData.get("therapist"), 100)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3) {
    return { ok: false, message: "Үнэлгээ, саналаа бүрэн оруулна уу." }
  }
  try {
    await legacyAuthenticatedRequest("/feedback", {
      method: "POST",
      body: JSON.stringify({
        therapistId: therapist ? Number(therapist) : null,
        rating,
        comment,
      }),
    })
    return { ok: true, message: "Санал хүсэлт илгээгдлээ. Баярлалаа." }
  } catch {
    return { ok: false, message: "Санал хүсэлт хадгалж чадсангүй." }
  }
}
