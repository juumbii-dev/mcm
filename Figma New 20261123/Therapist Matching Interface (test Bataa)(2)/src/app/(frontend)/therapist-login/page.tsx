import type { Metadata } from "next"
import TherapistLoginForm from "@/components/TherapistLoginForm"

export const metadata: Metadata = {
  title: "Зөвлөхийн нэвтрэх хэсэг | Сэтгэлзүйч",
}

export default function TherapistLoginPage() {
  return <TherapistLoginForm />
}
