import type { Access, CollectionConfig } from "payload"

const isAppUser: Access = ({ req }) => {
  if (req.user?.collection !== "users") return false
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    create: () => true,
    read: ({ req }) => {
      if (req.user?.collection === "admins") return true
      if (req.user?.collection !== "users") return false
      return { id: { equals: req.user.id } }
    },
    update: isAppUser,
    delete: ({ req }) => req.user?.collection === "admins",
    admin: ({ req }) => req.user?.collection === "admins",
  },
  admin: {
    useAsTitle: "email",
    group: "Зөвлөхийн бүртгэл",
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create") {
          data.accountType =
            req.context?.publicAccountType === "client"
              ? "client"
              : "therapist"
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: "fullName",
      type: "text",
      required: true,
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "accountType",
      type: "select",
      options: [
        { label: "Зөвлөх", value: "therapist" },
        { label: "Үйлчлүүлэгч", value: "client" },
      ],
      defaultValue: "therapist",
      required: true,
      saveToJWT: true,
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
  versions: false,
}
