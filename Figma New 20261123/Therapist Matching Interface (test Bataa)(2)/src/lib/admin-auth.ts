import "server-only"

import { therapistAuth } from "@/lib/app-auth"

export async function getCurrentCMSAdmin() {
  const user = await therapistAuth.currentUser()
  return user?.isAdmin ? user : null
}
