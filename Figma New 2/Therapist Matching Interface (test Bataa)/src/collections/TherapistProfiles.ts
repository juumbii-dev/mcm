import type { Access, CollectionConfig, Where } from "payload"

const isAdmin = (user: { collection?: string } | null | undefined) =>
  user?.collection === "admins"

const isPayloadAdmin: Access = ({ req }) => isAdmin(req.user)

const specializationOptions = [
  "Харилцааны бэрхшээл",
  "Амьдралын зорилго",
  "Ганцаардал / Тусгаарлагдал",
  "Өөрийгөө хайрлах",
  "Нийгмийн түгшүүр ба фоби",
  "Буруутгал ба ичгүүр",
  "Гэмтлийн дараах стресс (PTSD)",
  "Паник дарамт ба халдлага",
  "Хяналтын асуудал",
  "Уучлал",
  "Асрагчийн стресс",
  "Жирэмслэлт ба төрөлт",
  "Гэрлэлт цуцлалт",
  "Стресс ба сэтгэлийн зовниул",
  "Донтолтоос гарах",
  "ЛГБТК+ асуудал",
  "Гэр бүлийн зөрчил",
  "Гэмт хэрэг ба хүчирхийлэл",
  "Алдагдал ба гашуудал",
  "Дотно харилцааны асуудал",
  "Хоол тэжээлийн эмгэг",
  "Нойрны эмгэг",
  "Эцэг эхийн асуудал",
  "Урам зориг ба өөртөө итгэх",
  "Уур хилэн удирдах",
  "Ажил мэргэжлийн бэрхшээл",
  "Хоёр туйлт эмгэг",
  "Амьдралын өөрчлөлттэй зохицох",
  "Гүйцэтгэлийн дасгалжуулалт",
  "Энэрлийн ядаргаа",
  "Анхаарал ба ADHD",
].map((value) => ({ label: value, value }))

export const TherapistProfiles: CollectionConfig = {
  slug: "therapist-profiles",
  labels: {
    singular: "Зөвлөхийн профайл",
    plural: "Зөвлөхийн профайлууд",
  },
  access: {
    // Нэвтрэлт нь Node серверийн users хүснэгтэд байдаг тул Payload дээр зөвхөн admin бичнэ
    create: isPayloadAdmin,
    read: ({ req }) => {
      if (isAdmin(req.user)) return true
      return {
        and: [
          { status: { equals: "approved" } },
          {
            or: [
              { isVisible: { equals: true } },
              { isVisible: { exists: false } },
            ],
          },
        ],
      } as Where
    },
    update: isPayloadAdmin,
    delete: isPayloadAdmin,
    admin: ({ req }) => isAdmin(req.user),
  },
  admin: {
    useAsTitle: "name",
    group: "Зөвлөхийн бүртгэл",
    defaultColumns: [
      "name",
      "status",
      "isVisible",
      "experience",
      "updatedAt",
    ],
  },
  fields: [
    {
      name: "ownerUserId",
      label: "Node users.id",
      type: "number",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Энэ профайлтай холбогдох Node серверийн нэвтрэлтийн хэрэглэгчийн ID.",
      },
    },
    {
      name: "legacyPsychologistId",
      label: "Node psychologists.id",
      type: "number",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Node серверийн psychologists хүснэгтийн анхны ID (захиалгын холбоос).",
      },
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Хянагдаж байна", value: "pending" },
        { label: "Нэмэлт мэдээлэл шаардлагатай", value: "needs-info" },
        { label: "Баталгаажсан", value: "approved" },
        { label: "Татгалзсан", value: "rejected" },
      ],
      defaultValue: "pending",
      required: true,
      index: true,
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
      admin: { position: "sidebar" },
    },
    {
      name: "isVisible",
      label: "Сайтад идэвхтэй харагдах",
      type: "checkbox",
      defaultValue: false,
      index: true,
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
      admin: {
        position: "sidebar",
        description:
          "Зөвхөн баталгаажсан профайлыг энэ сонголтоор нийтэд харуулна.",
      },
    },
    { name: "name", type: "text", required: true, index: true },
    {
      name: "legacyFocus",
      label: "Node-ийн анхны мэргэжлийн чиглэл (текст)",
      type: "textarea",
      admin: {
        description: "Node-оос шилжсэн эх текст. Сонголтод багтаагүй утгууд энд хадгалагдана.",
      },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
    },
    {
      type: "row",
      fields: [
        {
          name: "gender",
          type: "select",
          options: [
            { label: "Эмэгтэй", value: "female" },
            { label: "Эрэгтэй", value: "male" },
            { label: "Бусад", value: "other" },
          ],
        },
        { name: "age", type: "number", min: 20, max: 90 },
        {
          name: "ageGroup",
          type: "select",
          options: ["25-35", "35-45", "45-55", "55+"],
        },
      ],
    },
    { name: "professionalTitle", type: "text" },
    { name: "bio", type: "textarea" },
    {
      name: "education",
      type: "array",
      fields: [
        { name: "school", type: "text", required: true },
        { name: "degree", type: "text", required: true },
        { name: "graduationYear", type: "number" },
      ],
    },
    {
      name: "license",
      label: "Лицензийн мэдээлэл (заавал биш)",
      type: "group",
      fields: [
        { name: "hasLicense", type: "checkbox", defaultValue: false },
        {
          name: "number",
          type: "text",
          admin: { condition: (_, siblingData) => siblingData?.hasLicense },
        },
        {
          name: "issuer",
          type: "text",
          admin: { condition: (_, siblingData) => siblingData?.hasLicense },
        },
        {
          name: "expiresAt",
          type: "date",
          admin: { condition: (_, siblingData) => siblingData?.hasLicense },
        },
      ],
    },
    {
      name: "categories",
      type: "select",
      hasMany: true,
      options: [
        { label: "Хувь хүний зөвлөгөө", value: "personal" },
        { label: "Хосын харилцааны зөвлөгөө", value: "couples" },
        { label: "Өсвөр насны зөвлөгөө", value: "teen" },
        { label: "Хүүхдийн зөвлөгөө", value: "family" },
        { label: "Бусад", value: "other" },
      ],
    },
    {
      name: "specializations",
      type: "select",
      hasMany: true,
      options: specializationOptions,
    },
    {
      name: "format",
      type: "select",
      hasMany: true,
      options: [
        { label: "Онлайн", value: "online" },
        { label: "Биечлэн", value: "inperson" },
      ],
    },
    {
      name: "calendlyURL",
      label: "Calendly цаг захиалгын холбоос",
      type: "text",
      validate: (value: null | string | undefined) => {
        if (!value) return true
        try {
          const url = new URL(String(value))
          return (
            (url.protocol === "https:" &&
              (url.hostname === "calendly.com" ||
                url.hostname.endsWith(".calendly.com"))) ||
            "https://calendly.com/... хэлбэрийн холбоос оруулна уу."
          )
        } catch {
          return "Calendly холбоос буруу байна."
        }
      },
      admin: {
        description:
          "Үйлчлүүлэгч энэ холбоосоор цаг сонгоно. Calendly Meet/Zoom линкийг автоматаар илгээнэ.",
      },
    },
    {
      name: "meetingProvider",
      label: "Онлайн уулзалтын хэрэгсэл",
      type: "select",
      options: [
        { label: "Google Meet", value: "google-meet" },
        { label: "Zoom", value: "zoom" },
      ],
      defaultValue: "google-meet",
    },
    {
      name: "chatAvailability",
      label: "Чатлах болон уулзах боломжит цаг",
      type: "array",
      maxRows: 14,
      admin: {
        description:
          "Үйлчлүүлэгч чат болон уулзалтын тохирох цаг хайхад ашиглах тогтмол хуваарь.",
      },
      fields: [
        {
          name: "day",
          label: "Гараг",
          type: "select",
          options: [
            { label: "Даваа", value: "monday" },
            { label: "Мягмар", value: "tuesday" },
            { label: "Лхагва", value: "wednesday" },
            { label: "Пүрэв", value: "thursday" },
            { label: "Баасан", value: "friday" },
            { label: "Бямба", value: "saturday" },
            { label: "Ням", value: "sunday" },
          ],
          required: true,
        },
        {
          type: "row",
          fields: [
            {
              name: "startTime",
              label: "Эхлэх цаг",
              type: "text",
              required: true,
              validate: (value: null | string | undefined) =>
                /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "") ||
                "HH:MM хэлбэрээр оруулна уу.",
            },
            {
              name: "endTime",
              label: "Дуусах цаг",
              type: "text",
              required: true,
              validate: (value: null | string | undefined) =>
                /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "") ||
                "HH:MM хэлбэрээр оруулна уу.",
            },
          ],
        },
      ],
    },
    {
      name: "location",
      type: "group",
      fields: [
        { name: "aimag", type: "text" },
        { name: "district", type: "text" },
        { name: "address", type: "text" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "experience", type: "number", min: 0, required: true },
        { name: "price", type: "number", min: 0, required: true },
        { name: "sessionLength", type: "number", defaultValue: 60, min: 30 },
      ],
    },
    { name: "languages", type: "text", hasMany: true },
    { name: "approach", type: "textarea" },
    { name: "rating", type: "number", min: 0, max: 5, defaultValue: 0 },
    { name: "sessions", type: "number", min: 0, defaultValue: 0 },
  ],
  versions: false,
}
