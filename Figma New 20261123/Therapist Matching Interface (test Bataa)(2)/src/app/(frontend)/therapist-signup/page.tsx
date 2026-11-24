import type { Metadata } from "next"
import TherapistSignup from "@/components/TherapistSignup"

export const metadata: Metadata = {
  title: "Зөвлөхөөр бүртгүүлэх | Сэтгэлзүйч",
  description:
    "Сэтгэл зүйн зөвлөхийн профайлаа үүсгэж, үйлчилгээ болон мэргэшлийн мэдээллээ бүртгүүлнэ үү.",
}

export default function TherapistSignupPage() {
  return <TherapistSignup />
}
