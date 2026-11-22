"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  getTherapistInbox,
  type InboxConversation,
} from "@/lib/supabase-chat"

export default function RealtimeInbox({
  therapistId,
}: {
  therapistId: string
}) {
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    const load = () =>
      getTherapistInbox(therapistId)
        .then((items) => {
          if (!active) return
          setConversations(items)
          setError("")
          setLoading(false)
        })
        .catch((cause) => {
          if (!active) return
          setError(
            cause instanceof Error
              ? cause.message
              : "Inbox ачаалж чадсангүй.",
          )
          setLoading(false)
        })
    void load()
    const timer = window.setInterval(load, 30_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [therapistId])

  if (loading) {
    return (
      <div className="rounded-3xl border border-dashed border-[#d9c7b2] bg-white p-10 text-center text-[#7d6f63]">
        Realtime inbox ачаалж байна...
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-3xl bg-[#fff0e9] p-6 text-center font-bold text-[#96533e]"
      >
        {error}
      </div>
    )
  }

  if (!conversations.length) {
    return (
      <div className="rounded-3xl border border-dashed border-[#d9c7b2] bg-white p-10 text-center text-[#7d6f63]">
        Одоогоор шинэ чат ирээгүй байна.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/chat/${conversation.id}`}
          className="flex items-center justify-between gap-5 rounded-3xl border border-[#e6dbcf] bg-white p-5 transition hover:border-[#9fb9ad] hover:shadow-sm"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4e9279]" />
              <h2 className="truncate font-bold">{conversation.guestName}</h2>
            </div>
            <p className="mt-1 truncate text-sm text-[#7d6f63]">
              {conversation.lastMessage || "Шинэ чат эхэлсэн"}
            </p>
            <p className="mt-1 text-xs text-[#a09082]">
              {new Date(conversation.updatedAt).toLocaleString("mn-MN")}
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold text-[#55796a]">
            Нээх →
          </span>
        </Link>
      ))}
    </div>
  )
}
