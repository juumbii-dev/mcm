import type { Access, CollectionConfig, Where } from "payload"

const feedbackAccess: Access = ({ req }) => {
  if (req.user?.collection === "admins") return true
  if (req.user?.collection !== "users") return false
  if (req.user.accountType === "client") {
    return { client: { equals: req.user.id } }
  }
  return { "therapist.owner": { equals: req.user.id } } as Where
}

export const ClientFeedback: CollectionConfig = {
  slug: "client-feedback",
  labels: { singular: "Санал хүсэлт", plural: "Санал хүсэлтүүд" },
  access: {
    create: ({ req }) =>
      req.user?.collection === "users" &&
      req.user.accountType === "client",
    read: feedbackAccess,
    update: () => false,
    delete: ({ req }) => req.user?.collection === "admins",
    admin: ({ req }) => req.user?.collection === "admins",
  },
  admin: {
    group: "Чат ба санал хүсэлт",
    defaultColumns: ["client", "therapist", "rating", "createdAt"],
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const therapistID =
          typeof data?.therapist === "object"
            ? data.therapist.id
            : data?.therapist
        if (!therapistID) return data
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
          throw new Error("Энэ зөвлөхөд санал хүсэлт илгээх боломжгүй.")
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create" && req.user?.collection === "users") {
          data.client = req.user.id
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
      access: { create: () => false, update: () => false },
    },
    {
      name: "therapist",
      type: "relationship",
      relationTo: "therapist-profiles",
    },
    {
      name: "rating",
      type: "number",
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: "comment",
      type: "textarea",
      required: true,
      minLength: 3,
      maxLength: 1500,
    },
  ],
  versions: false,
}
