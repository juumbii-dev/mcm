import type { CollectionConfig } from "payload"

export const Bookings: CollectionConfig = {
  slug: "bookings",
  labels: {
    singular: "Цаг захиалга",
    plural: "Цаг захиалгууд",
  },
  access: {
    create: () => true,
    read: ({ req }) => req.user?.collection === "admins",
    update: ({ req }) => req.user?.collection === "admins",
    delete: ({ req }) => req.user?.collection === "admins",
    admin: ({ req }) => req.user?.collection === "admins",
  },
  admin: {
    group: "Захиалга",
    useAsTitle: "date",
    defaultColumns: ["therapist", "date", "time", "format", "status"],
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
        if (therapist.status !== "approved") {
          throw new Error("Зөвхөн баталгаажсан зөвлөхийн цагийг захиална.")
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: "therapist",
      type: "relationship",
      relationTo: "therapist-profiles",
      required: true,
    },
    { name: "date", type: "date", required: true },
    { name: "time", type: "text", required: true },
    {
      name: "format",
      type: "select",
      options: ["online", "inperson"],
      required: true,
    },
    { name: "note", type: "textarea" },
    {
      name: "paymentMethod",
      type: "select",
      options: ["account-qr", "socialpay", "qpay", "bank"],
      required: true,
    },
    { name: "meetingLink", type: "text" },
    {
      name: "status",
      type: "select",
      options: ["pending", "confirmed", "cancelled", "completed"],
      defaultValue: "pending",
      required: true,
      access: {
        create: () => false,
        update: ({ req }) => req.user?.collection === "admins",
      },
    },
  ],
  versions: false,
}
