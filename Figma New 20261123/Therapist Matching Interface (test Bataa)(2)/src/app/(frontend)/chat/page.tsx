import { connection } from "next/server"
import ChatHub, { type ChatTherapist } from "@/components/ChatHub"
import { legacyRequest } from "@/lib/legacy-api"

export default async function ChatPage() {
  await connection()
  const profiles = await legacyRequest<Array<Record<string, unknown>>>(
    "/psychologists",
  )

  const therapists: ChatTherapist[] = profiles.map((profile) => ({
    id: String(profile.id),
    name: String(profile.name || "Зөвлөх"),
    professionalTitle: String(profile.specialty || "Зөвлөх"),
    bio: String(profile.bio || profile.focus || ""),
    approach: undefined,
    photo: profile.photo
      ? { url: String(profile.photo), alt: String(profile.name || "Зөвлөх") }
      : undefined,
    experience: Number(profile.experience || 0),
    price: Number(profile.price || 0),
    sessionLength: 60,
    gender: String(profile.gender || ""),
    format: Array.isArray(profile.session_formats)
      ? profile.session_formats.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    categories: Array.isArray(profile.categories)
      ? profile.categories.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    specializations: Array.isArray(profile.specializations)
      ? profile.specializations.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    languages: Array.isArray(profile.languages)
      ? profile.languages.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    location: {
      aimag: String(profile.aimag || profile.city || ""),
      district: profile.district ? String(profile.district) : undefined,
    },
    education: [],
    calendlyURL: profile.calendly_url
      ? String(profile.calendly_url)
      : undefined,
    meetingProvider: profile.meeting_provider
      ? String(profile.meeting_provider)
      : undefined,
    chatAvailability: Array.isArray(profile.chat_availability)
      ? profile.chat_availability.filter(
          (item): item is ChatTherapist["chatAvailability"][number] =>
            typeof item === "object" &&
            item !== null &&
            "day" in item &&
            "startTime" in item &&
            "endTime" in item &&
            typeof item.day === "string" &&
            typeof item.startTime === "string" &&
            typeof item.endTime === "string",
        )
      : [],
  }))

  return <ChatHub therapists={therapists} />
}
