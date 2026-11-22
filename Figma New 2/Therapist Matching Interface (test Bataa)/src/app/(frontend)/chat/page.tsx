import { connection } from "next/server"
import ChatHub, { type ChatTherapist } from "@/components/ChatHub"
import { getPayloadClient } from "@/lib/payload"

export default async function ChatPage() {
  await connection()
  const payload = await getPayloadClient()
  const therapistResult = await payload.find({
    collection: "therapist-profiles",
    overrideAccess: false,
    depth: 1,
    limit: 100,
    sort: "-rating",
  })

  const therapists: ChatTherapist[] = therapistResult.docs.map((profile) => ({
    id: String(profile.id),
    name: profile.name,
    professionalTitle: profile.professionalTitle,
    bio: profile.bio,
    approach: profile.approach ?? undefined,
    photo:
      typeof profile.photo === "object" && profile.photo?.url
        ? {
            url: profile.photo.url,
            alt: profile.photo.alt || profile.name,
          }
        : undefined,
    experience: profile.experience,
    price: profile.price,
    sessionLength: profile.sessionLength ?? 60,
    gender: profile.gender,
    format: profile.format ?? [],
    categories: profile.categories ?? [],
    specializations: profile.specializations ?? [],
    languages: profile.languages ?? [],
    location: profile.location
      ? {
          aimag: profile.location.aimag ?? undefined,
          district: profile.location.district ?? undefined,
          address: profile.location.address ?? undefined,
        }
      : undefined,
    education: (profile.education ?? []).map((item) => ({
      school: item.school,
      degree: item.degree,
    })),
    calendlyURL: profile.calendlyURL ?? undefined,
    meetingProvider: profile.meetingProvider ?? undefined,
    chatAvailability: (profile.chatAvailability ?? []).map((slot) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
  }))

  return <ChatHub therapists={therapists} />
}
