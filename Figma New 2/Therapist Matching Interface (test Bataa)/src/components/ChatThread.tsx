"use client"

import Link from "next/link"
import { FormEvent, useEffect, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import {
  getConversation,
  sendRealtimeMessage,
  supabase,
  type RealtimeMessage,
} from "@/lib/supabase-chat"

export default function ChatThread({
  conversationId,
  title,
  subtitle,
  currentRole,
  therapistId,
}: {
  conversationId: string
  title: string
  subtitle: string
  currentRole: "client" | "therapist"
  therapistId?: string
}) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [heading, setHeading] = useState(title)
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    let active = true
    getConversation(conversationId, currentRole, therapistId)
      .then((conversation) => {
        if (!active) return
        setMessages(conversation.messages)
        setHeading(
          currentRole === "therapist"
            ? conversation.guestName
            : conversation.therapistName,
        )
        setLoading(false)
      })
      .catch((cause) => {
        if (!active) return
        setError(
          cause instanceof Error
            ? cause.message
            : "Чатын мэдээлэл авч чадсангүй.",
        )
        setLoading(false)
      })

    const channel = supabase
      .channel(`therapy-chat:${conversationId}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const message = payload as RealtimeMessage
        if (message.conversationId !== conversationId) return
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        )
      })
      .subscribe()
    channelRef.current = channel

    return () => {
      active = false
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [conversationId, currentRole, therapistId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const messageBody = body.trim()
    if (!messageBody || pending) return
    setPending(true)
    setError("")
    try {
      const message = await sendRealtimeMessage({
        conversationId,
        role: currentRole,
        therapistId,
        body: messageBody,
      })
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      )
      setBody("")
      await channelRef.current?.send({
        type: "broadcast",
        event: "message",
        payload: message,
      })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Мессеж илгээж чадсангүй.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-[#2d2620]">
      <header className="border-b border-[#e7ddd2] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href={
              currentRole === "therapist" ? "/therapist/messages" : "/chat"
            }
            className="shrink-0 text-sm font-bold text-[#7d6f63]"
          >
            ← Буцах
          </Link>
          <div className="min-w-0 text-center">
            <h1 className="truncate font-display text-xl font-semibold">
              {heading}
            </h1>
            <p className="truncate text-xs text-[#7d6f63]">{subtitle}</p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-bold text-[#55796a]"
          >
            Нүүр
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl flex-col px-4 py-5 sm:px-6">
        <div className="mb-4 rounded-2xl bg-[#e8f1ed] px-4 py-3 text-center text-xs leading-5 text-[#557064]">
          Supabase Realtime холболт идэвхтэй. Эмчилгээний яаралтай болон нууц
          хувийн мэдээллийг энэ чатад бүү илгээнэ үү.
        </div>

        <div className="flex-1 space-y-3 rounded-[28px] border border-[#e7ddd2] bg-[#fffdf9] p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center text-sm font-bold text-[#7d6f63]">
              Чат ачаалж байна...
            </div>
          ) : messages.length === 0 && !error ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dfece6] text-2xl text-[#55796a]">
                +
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                Чат эхэллээ
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#7d6f63]">
                Өөрийн нэрийг заавал өгөх шаардлагагүй. Асуух зүйлээ доорх
                composer-т бичиж илгээнэ үү.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const own = message.senderRole === currentRole
              return (
                <div
                  key={message.id}
                  className={`flex ${own ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[84%] rounded-3xl px-4 py-3 sm:max-w-[72%] ${
                      own
                        ? "rounded-br-md bg-[#55796a] text-white"
                        : "rounded-bl-md border border-[#e6dbcf] bg-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.body}
                    </p>
                    <p
                      className={`mt-1 text-[10px] ${
                        own ? "text-white/60" : "text-[#9b8d80]"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString("mn-MN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={submit}
          className="sticky bottom-3 mt-4 rounded-[26px] border border-[#d9cec2] bg-white p-3 shadow-[0_16px_50px_rgba(74,58,45,0.14)]"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              required
              rows={2}
              maxLength={2000}
              placeholder="Мессеж бичих..."
              className="min-h-14 flex-1 resize-none rounded-2xl bg-[#f8f4ef] px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-[#7a9e8e]/10"
            />
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="rounded-full bg-[#55796a] px-5 py-3.5 text-sm font-extrabold text-white disabled:opacity-45"
            >
              {pending ? "..." : "Илгээх"}
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-2 rounded-xl bg-[#fff0e9] px-3 py-2 text-xs font-bold text-[#96533e]"
            >
              {error}
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
