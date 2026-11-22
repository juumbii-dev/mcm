"use server"

import config from "@payload-config"
import { getPayload } from "payload"
import { therapistAuth } from "@/lib/app-auth"

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

  let createdID: string | number | null = null
  try {
    const payload = await getPayload({ config })
    const user = await payload.create({
      collection: "users",
      overrideAccess: false,
      draft: false,
      context: { publicAccountType: "client" },
      data: {
        email,
        password,
        fullName,
        accountType: "client",
      },
    })
    createdID = user.id
    await therapistAuth.login(email, password)
    return { ok: true, message: "Бүртгэл амжилттай." }
  } catch (error) {
    if (createdID) {
      try {
        const payload = await getPayload({ config })
        await payload.delete({
          collection: "users",
          id: createdID,
          overrideAccess: true,
        })
      } catch {
        // Keep the original registration error.
      }
    }
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
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: "chat-conversations",
    overrideAccess: false,
    user,
    where: {
      and: [
        { client: { equals: user.id } },
        { therapist: { equals: therapistID } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    return {
      ok: true,
      message: "Чат нээгдлээ.",
      conversationId: String(existing.docs[0].id),
    }
  }

  try {
    const conversation = await payload.create({
      collection: "chat-conversations",
      overrideAccess: false,
      user,
      draft: false,
      data: {
        client: user.id,
        therapist: therapistID,
        status: "open",
      },
    })
    return {
      ok: true,
      message: "Чат үүслээ.",
      conversationId: String(conversation.id),
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
    const payload = await getPayload({ config })
    await payload.create({
      collection: "chat-messages",
      overrideAccess: false,
      user,
      draft: false,
      data: {
        conversation,
        senderUser: user.id,
        senderRole:
          user.accountType === "therapist" ? "therapist" : "client",
        body,
      },
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
    const payload = await getPayload({ config })
    await payload.create({
      collection: "client-feedback",
      overrideAccess: false,
      user,
      draft: false,
      data: {
        client: user.id,
        therapist: therapist || undefined,
        rating,
        comment,
      },
    })
    return { ok: true, message: "Санал хүсэлт илгээгдлээ. Баярлалаа." }
  } catch {
    return { ok: false, message: "Санал хүсэлт хадгалж чадсангүй." }
  }
}
