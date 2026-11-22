import "server-only"

import { headers } from "next/headers"
import { getPayloadClient } from "@/lib/payload"

export async function getCurrentCMSAdmin() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.collection !== "admins") return null
  return user
}
