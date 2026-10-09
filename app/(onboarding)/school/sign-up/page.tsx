import type { Metadata } from "next";
import { TeacherSignUpForm } from "@/components/onboarding/teacher-sign-up-form";

export const metadata: Metadata = {
  title: "Create your teacher account",
  description: "Create a NextGenAchievers teacher account for your class.",
};

export default function SchoolSignUpPage() {
  return <TeacherSignUpForm />;
}
