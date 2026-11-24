import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const prefix = "/make-server-4a18afeb";

type ChatMessage = {
  id: string;
  conversationId: string;
  body: string;
  senderRole: "client" | "therapist";
  createdAt: string;
};

type Conversation = {
  id: string;
  guestId: string;
  guestToken: string;
  guestName: string;
  therapistId: string;
  therapistName: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

const clean = (value: unknown, max = 2000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get(`${prefix}/health`, (c) => c.json({ status: "ok" }));

app.post(`${prefix}/chat/conversations`, async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const id = clean(input.id, 80);
  const guestId = clean(input.guestId, 80);
  const guestToken = clean(input.guestToken, 120);
  const guestName = clean(input.guestName, 80) || "Зочин";
  const therapistId = clean(input.therapistId, 100);
  const therapistName = clean(input.therapistName, 120) || "Зөвлөх";

  if (!id || !guestId || !guestToken || !therapistId) {
    return c.json({ error: "Conversation мэдээлэл дутуу байна." }, 400);
  }

  const existing = await kv.get(`conversation:${id}`) as Conversation | undefined;
  if (existing) {
    if (existing.guestId !== guestId || existing.guestToken !== guestToken) {
      return c.json({ error: "Conversation нээх эрхгүй байна." }, 403);
    }
    return c.json({ conversation: existing });
  }

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id,
    guestId,
    guestToken,
    guestName,
    therapistId,
    therapistName,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  await kv.set(`conversation:${id}`, conversation);

  const inboxKey = `therapist:${therapistId}:conversations`;
  const inbox = (await kv.get(inboxKey) as Array<Record<string, unknown>> | undefined) ?? [];
  await kv.set(inboxKey, [
    {
      id,
      guestName,
      therapistName,
      updatedAt: now,
      lastMessage: "",
    },
    ...inbox.filter((item) => item.id !== id),
  ].slice(0, 100));

  return c.json({ conversation });
});

app.get(`${prefix}/chat/conversations/:id`, async (c) => {
  const conversation = await kv.get(`conversation:${clean(c.req.param("id"), 80)}`) as Conversation | undefined;
  if (!conversation) return c.json({ error: "Conversation олдсонгүй." }, 404);

  const role = c.req.query("role");
  const allowed =
    role === "therapist"
      ? c.req.query("therapistId") === conversation.therapistId
      : c.req.query("guestId") === conversation.guestId &&
        c.req.query("token") === conversation.guestToken;
  if (!allowed) return c.json({ error: "Conversation харах эрхгүй байна." }, 403);

  const { guestToken: _secret, ...safeConversation } = conversation;
  return c.json({ conversation: safeConversation });
});

app.get(`${prefix}/chat/therapists/:id/conversations`, async (c) => {
  const therapistId = clean(c.req.param("id"), 100);
  const conversations =
    (await kv.get(`therapist:${therapistId}:conversations`) as unknown[] | undefined) ?? [];
  return c.json({ conversations });
});

app.post(`${prefix}/chat/conversations/:id/messages`, async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const id = clean(c.req.param("id"), 80);
  const conversation = await kv.get(`conversation:${id}`) as Conversation | undefined;
  if (!conversation) return c.json({ error: "Conversation олдсонгүй." }, 404);

  const senderRole = input.senderRole === "therapist" ? "therapist" : "client";
  const allowed =
    senderRole === "therapist"
      ? clean(input.therapistId, 100) === conversation.therapistId
      : clean(input.guestId, 80) === conversation.guestId &&
        clean(input.guestToken, 120) === conversation.guestToken;
  if (!allowed) return c.json({ error: "Мессеж илгээх эрхгүй байна." }, 403);

  const body = clean(input.body);
  if (!body) return c.json({ error: "Мессежээ бичнэ үү." }, 400);

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId: id,
    body,
    senderRole,
    createdAt: new Date().toISOString(),
  };
  conversation.messages = [...conversation.messages, message].slice(-250);
  conversation.updatedAt = message.createdAt;
  await kv.set(`conversation:${id}`, conversation);

  const inboxKey = `therapist:${conversation.therapistId}:conversations`;
  const inbox = (await kv.get(inboxKey) as Array<Record<string, unknown>> | undefined) ?? [];
  await kv.set(inboxKey, [
    {
      id,
      guestName: conversation.guestName,
      therapistName: conversation.therapistName,
      updatedAt: message.createdAt,
      lastMessage: body.slice(0, 120),
    },
    ...inbox.filter((item) => item.id !== id),
  ].slice(0, 100));

  return c.json({ message });
});

Deno.serve(app.fetch);
