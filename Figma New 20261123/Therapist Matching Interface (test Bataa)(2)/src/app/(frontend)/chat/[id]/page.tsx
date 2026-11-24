import ChatThread from "@/components/ChatThread"
import { therapistAuth } from "@/lib/app-auth"

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
    therapistId = user.psychologistId
      ? String(user.psychologistId)
      : undefined
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
