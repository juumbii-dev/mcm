import type { Access, CollectionConfig, Where } from "payload"

const participantAccess: Access = ({ req }) => {
  if (req.user?.collection === "admins") return true
  if (req.user?.collection !== "users") return false
  if (req.user.accountType === "client") {
    return { client: { equals: req.user.id } }
  }
  return { "therapist.owner": { equals: req.user.id } } as Where
}

export const ChatConversations: CollectionConfig = {
  slug: "chat-conversations",
  labels: { singular: "Чат", plural: "Чатууд" },
  access: {
    create: ({ req }) =>
      req.user?.collection === "users" &&
      req.user.accountType === "client",
    read: participantAccess,
    update: participantAccess,
    delete: ({ req }) => req.user?.collection === "admins",
    admin: ({ req }) => req.user?.collection === "admins",
  },
  admin: {
    group: "Чат ба санал хүсэлт",
    defaultColumns: ["therapist", "client", "status", "lastMessageAt"],
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const therapistID =
          typeof data?.therapist === "object"
            ? data.therapist.id
            : data?.therapist
        if (!therapistID) throw new Error("Зөвлөх сонгоно уу.")
        const therapist = await req.payload.findByID({
          collection: "therapist-profiles",
          id: therapistID,
          depth: 0,
          overrideAccess: true,
          req,
        })
        if (
          therapist.status !== "approved" ||
          therapist.isVisible === false
        ) {
          throw new Error("Энэ зөвлөх одоогоор чат хүлээн авах боломжгүй.")
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create" && req.user?.collection === "users") {
          data.client = req.user.id
          data.status = "open"
          data.lastMessageAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: "client",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: "therapist",
      type: "relationship",
      relationTo: "therapist-profiles",
      required: true,
      index: true,
      access: { update: () => false },
    },
    {
      name: "status",
      type: "select",
      options: ["open", "closed"],
      defaultValue: "open",
      required: true,
      access: {
        create: () => false,
        update: ({ req }) =>
          req.user?.collection === "admins" ||
          (req.user?.collection === "users" &&
            req.user.accountType === "therapist"),
      },
    },
    {
      name: "lastMessageAt",
      type: "date",
      index: true,
      access: { create: () => false, update: () => false },
    },
  ],
  versions: false,
}
