import type { Access, CollectionConfig, Where } from "payload"

const messageParticipantAccess: Access = ({ req }) => {
  if (req.user?.collection === "admins") return true
  if (req.user?.collection !== "users") return false
  if (req.user.accountType === "client") {
    return { "conversation.client": { equals: req.user.id } } as Where
  }
  return {
    "conversation.therapist.owner": { equals: req.user.id },
  } as Where
}

export const ChatMessages: CollectionConfig = {
  slug: "chat-messages",
  labels: { singular: "Мессеж", plural: "Мессежүүд" },
  access: {
    create: ({ req }) => req.user?.collection === "users",
    read: messageParticipantAccess,
    update: () => false,
    delete: ({ req }) => req.user?.collection === "admins",
    admin: ({ req }) => req.user?.collection === "admins",
  },
  admin: {
    group: "Чат ба санал хүсэлт",
    defaultColumns: ["conversation", "senderRole", "createdAt"],
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (req.user?.collection !== "users") {
          throw new Error("Нэвтэрсэн хэрэглэгч шаардлагатай.")
        }
        const conversationID =
          typeof data?.conversation === "object"
            ? data.conversation.id
            : data?.conversation
        if (!conversationID) throw new Error("Чат сонгоно уу.")
        const conversation = await req.payload.findByID({
          collection: "chat-conversations",
          id: conversationID,
          depth: 1,
          overrideAccess: true,
          req,
        })
        const clientID =
          typeof conversation.client === "object"
            ? conversation.client.id
            : conversation.client
        const therapist =
          typeof conversation.therapist === "object"
            ? conversation.therapist
            : null
        const ownerID =
          therapist && typeof therapist.owner === "object"
            ? therapist.owner?.id
            : therapist?.owner
        if (clientID !== req.user.id && ownerID !== req.user.id) {
          throw new Error("Энэ чатад мессеж илгээх эрхгүй.")
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create" && req.user?.collection === "users") {
          data.senderUser = req.user.id
          data.senderRole =
            req.user.accountType === "therapist" ? "therapist" : "client"
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return
        const conversationID =
          typeof doc.conversation === "object"
            ? doc.conversation.id
            : doc.conversation
        await req.payload.update({
          collection: "chat-conversations",
          id: conversationID,
          data: { lastMessageAt: doc.createdAt },
          overrideAccess: true,
          req,
        })
      },
    ],
  },
  fields: [
    {
      name: "conversation",
      type: "relationship",
      relationTo: "chat-conversations",
      required: true,
      index: true,
    },
    {
      name: "senderUser",
      type: "relationship",
      relationTo: "users",
      required: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: "senderRole",
      type: "select",
      options: ["client", "therapist"],
      required: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      minLength: 1,
      maxLength: 2000,
    },
  ],
  versions: false,
}
