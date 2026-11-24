import { readFileSync } from "node:fs"
import config from "@payload-config"
import { getPayload } from "payload"
import { TherapistProfiles } from "../collections/TherapistProfiles"

// Node серверийн psychologists/users хүснэгтээс экспортолсон JSON.
const exportPath =
  "C:\\Users\\batbayar.nyam\\.copilot\\session-state\\2a27b258-9c73-4277-864c-3df6bea70bae\\files\\legacy-counselors.json"

type LegacyRow = {
  id: number
  name: string
  specialty: string
  focus: string | null
  rating: string | null
  price: number | null
  city: string | null
  experience: number | null
  status: string
  specializations: string[] | null
  categories: string[] | null
  session_formats: string[] | null
  sessions: number
  aimag: string | null
  is_visible: boolean
}

type LegacyExport = {
  psychologists: LegacyRow[]
  owners: Array<{ id: number; psychologist_id: number }>
}

const fieldValues = (name: string): string[] => {
  const field = TherapistProfiles.fields.find(
    (f) => "name" in f && f.name === name,
  ) as { options: Array<string | { value: string }> }
  return field.options.map((o) => (typeof o === "string" ? o : o.value))
}

const allowedSpecializations = fieldValues("specializations")
const allowedCategories = fieldValues("categories")
const allowedFormats = fieldValues("format")

const main = async () => {
  const legacy = JSON.parse(readFileSync(exportPath, "utf8")) as LegacyExport
  const ownerByPsychologist = new Map(
    legacy.owners.map((u) => [u.psychologist_id, u.id]),
  )

  const payload = await getPayload({ config })

  for (const row of legacy.psychologists) {
    const existing = await payload.find({
      collection: "therapist-profiles",
      where: { legacyPsychologistId: { equals: row.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`skip (already imported): ${row.id} ${row.name}`)
      continue
    }

    try {
      const doc = await payload.create({
        collection: "therapist-profiles",
        overrideAccess: true,
        data: {
          legacyPsychologistId: row.id,
          legacyFocus: row.focus,
          ownerUserId: ownerByPsychologist.get(row.id),
          name: row.name,
          status: row.status === "approved" ? "approved" : "pending",
          isVisible: row.is_visible,
          professionalTitle: row.specialty,
          experience: row.experience ?? 0,
          price: row.price ?? 0,
          rating: Math.min(5, Math.max(0, Number(row.rating ?? 0))),
          sessions: row.sessions ?? 0,
          categories: (row.categories ?? []).filter((c) =>
            allowedCategories.includes(c),
          ),
          specializations: (row.specializations ?? []).filter((s) =>
            allowedSpecializations.includes(s),
          ),
          format: (row.session_formats ?? []).filter((f) =>
            allowedFormats.includes(f),
          ),
          location: { aimag: row.aimag ?? row.city ?? null },
        } as never,
      })
      console.log(`imported: ${row.id} ${row.name} -> ${doc.id}`)
    } catch (error) {
      console.error(`FAILED: ${row.id} ${row.name}:`, (error as Error).message)
    }
  }

  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
