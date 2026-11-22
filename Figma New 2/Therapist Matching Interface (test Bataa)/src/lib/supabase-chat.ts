"use client"

import { createClient } from "@supabase/supabase-js"
import { projectId, publicAnonKey } from "../../utils/supabase/info"

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

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
)

const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-4a18afeb`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Supabase хүсэлтийг гүйцэтгэж чадсангүй.")
  }
  return data as T
}

export const guestStorage = {
  getIdentity() {
    let guestId = localStorage.getItem("therapy-guest-id")
    let guestName = localStorage.getItem("therapy-guest-name")
    if (!guestId) {
      guestId = crypto.randomUUID()
      localStorage.setItem("therapy-guest-id", guestId)
    }
    if (!guestName) {
      guestName = `Зочин ${guestId.slice(0, 4).toUpperCase()}`
      localStorage.setItem("therapy-guest-name", guestName)
    }
    return { guestId, guestName }
  },
  setToken(conversationId: string, token: string) {
    localStorage.setItem(`therapy-chat-token:${conversationId}`, token)
  },
  getToken(conversationId: string) {
    return localStorage.getItem(`therapy-chat-token:${conversationId}`) || ""
  },
}

export async function createGuestConversation(input: {
  therapistId: string
  therapistName: string
}) {
  const identity = guestStorage.getIdentity()
  const id = crypto.randomUUID()
  const guestToken = `${crypto.randomUUID()}${crypto.randomUUID()}`
  const result = await request<{ conversation: RealtimeConversation }>(
    "/chat/conversations",
    {
      method: "POST",
      body: JSON.stringify({ id, guestToken, ...identity, ...input }),
    },
  )
  guestStorage.setToken(id, guestToken)
  return result.conversation
}

export async function getConversation(
  conversationId: string,
  role: "client" | "therapist",
  therapistId?: string,
) {
  const query =
    role === "therapist"
      ? `role=therapist&therapistId=${encodeURIComponent(therapistId || "")}`
      : (() => {
          const { guestId } = guestStorage.getIdentity()
          const token = guestStorage.getToken(conversationId)
          return `role=client&guestId=${encodeURIComponent(guestId)}&token=${encodeURIComponent(token)}`
        })()
  const result = await request<{ conversation: RealtimeConversation }>(
    `/chat/conversations/${encodeURIComponent(conversationId)}?${query}`,
  )
  return result.conversation
}

export async function sendRealtimeMessage(input: {
  conversationId: string
  role: "client" | "therapist"
  therapistId?: string
  body: string
}) {
  const identity =
    input.role === "client" ? guestStorage.getIdentity() : { guestId: "" }
  const result = await request<{ message: RealtimeMessage }>(
    `/chat/conversations/${encodeURIComponent(input.conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        body: input.body,
        senderRole: input.role,
        therapistId: input.therapistId,
        guestToken:
          input.role === "client"
            ? guestStorage.getToken(input.conversationId)
            : undefined,
        ...identity,
      }),
    },
  )
  return result.message
}

export async function getTherapistInbox(therapistId: string) {
  const result = await request<{ conversations: InboxConversation[] }>(
    `/chat/therapists/${encodeURIComponent(therapistId)}/conversations`,
  )
  return result.conversations
}
