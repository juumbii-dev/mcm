import ChatThread from "@/components/ChatThread"
import { therapistAuth } from "@/lib/app-auth"
import { getPayloadClient } from "@/lib/payload"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await therapistAuth.currentUser()
  const isTherapist = user?.accountType === "therapist"
  let therapistId: string | undefined

  if (isTherapist) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: "therapist-profiles",
      overrideAccess: false,
      user,
      where: { owner: { equals: user.id } },
      depth: 0,
      limit: 1,
    })
    therapistId = result.docs[0] ? String(result.docs[0].id) : undefined
  }

  return (
    <ChatThread
      conversationId={id}
      title={isTherapist ? "Үйлчлүүлэгч" : "Зөвлөх"}
      subtitle={
        isTherapist
          ? "Supabase Realtime үйлчлүүлэгчийн чат"
          : "Нууц нэрээр шууд чат"
      }
      currentRole={isTherapist ? "therapist" : "client"}
      therapistId={therapistId}
    />
  )
}
