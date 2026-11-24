"use client"

export type RealtimeMessage = {
  id: string
  conversationId: string
  body: string
  senderRole: "client" | "therapist"
  createdAt: string
}

export type RealtimeConversation = {
  id: string
  guestId: string
  guestName: string
  therapistId: string
  therapistName: string
  createdAt: string
  updatedAt: string
  messages: RealtimeMessage[]
}

export type InboxConversation = {
  id: string
  guestName: string
  therapistName: string
  updatedAt: string
  lastMessage: string
}

type LegacyConversation = {
  id: number
  therapist_id: number
  client_id: number | null
  created_at: string
  updated_at: string
}

type LegacyMessage = {
  id: number
  conversationId: number
  senderId: number | null
  body: string
  createdAt: string
}

function guestTokenKey(conversationId: string) {
  return `mindconnect-guest-chat:${conversationId}`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const conversationId = path.match(/\/conversations\/(\d+)/)?.[1]
  const guestToken = conversationId
    ? window.localStorage.getItem(guestTokenKey(conversationId))
    : null
  const response = await fetch(`/legacy-api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
      ...init?.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Chat хүсэлтийг гүйцэтгэж чадсангүй.")
  }
  return data as T
}

function mapMessage(
  message: LegacyMessage,
  clientId: number | null,
  fallbackRole?: "client" | "therapist",
): RealtimeMessage {
  return {
    id: String(message.id),
    conversationId: String(message.conversationId),
    body: message.body,
    senderRole: fallbackRole
      ? fallbackRole
      : message.senderId === null || message.senderId === clientId
        ? "client"
        : "therapist",
    createdAt: message.createdAt,
  }
}

function mapConversation(
  conversation: LegacyConversation,
  messages: LegacyMessage[] = [],
): RealtimeConversation {
  return {
    id: String(conversation.id),
    guestId: conversation.client_id ? String(conversation.client_id) : "",
    guestName: "Үйлчлүүлэгч",
    therapistId: String(conversation.therapist_id),
    therapistName: "Зөвлөх",
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: messages.map((message) =>
      mapMessage(message, conversation.client_id),
    ),
  }
}

export const guestStorage = {
  getIdentity() {
    return { guestId: "", guestName: "Үйлчлүүлэгч" }
  },
  setToken() {},
  getToken() {
    return ""
  },
}

export async function createGuestConversation(input: {
  therapistId: string
  therapistName: string
}) {
  const result = await request<{
    conversation: LegacyConversation
    guestToken?: string
  }>(
    "/chat/conversations",
    {
      method: "POST",
      body: JSON.stringify({ therapistId: Number(input.therapistId) }),
    },
  )
  if ("guestToken" in result && typeof result.guestToken === "string") {
    window.localStorage.setItem(
      guestTokenKey(String(result.conversation.id)),
      result.guestToken,
    )
  }
  return mapConversation(result.conversation)
}

export async function getConversation(
  conversationId: string,
  _role: "client" | "therapist",
  _therapistId?: string,
) {
  const result = await request<{
    conversation: LegacyConversation
    messages: LegacyMessage[]
  }>(`/chat/conversations/${encodeURIComponent(conversationId)}`)
  return mapConversation(result.conversation, result.messages)
}

export async function sendRealtimeMessage(input: {
  conversationId: string
  role: "client" | "therapist"
  therapistId?: string
  body: string
}) {
  const result = await request<{ message: LegacyMessage }>(
    `/chat/conversations/${encodeURIComponent(input.conversationId)}`,
    {
      method: "POST",
      body: JSON.stringify({ body: input.body }),
    },
  )
  return mapMessage(result.message, null, input.role)
}

export async function getTherapistInbox(_therapistId: string) {
  const result = await request<{ conversations: LegacyConversation[] }>(
    "/chat/conversations",
  )
  return result.conversations.map((conversation) => ({
    id: String(conversation.id),
    guestName: "Үйлчлүүлэгч",
    therapistName: "Зөвлөх",
    updatedAt: conversation.updated_at,
    lastMessage: "",
  }))
}
