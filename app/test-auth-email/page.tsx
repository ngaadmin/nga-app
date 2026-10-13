import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Test Auth Email",
  description: "Dev only — Supabase confirmation email check.",
};

/**
 * Dev / QA route. Production returns 404.
 * The form import sits in the development branch so the test password is not
 * part of the production client bundle.
 */
export default async function TestAuthEmailPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  } else {
    const { TestAuthEmailForm } = await import(
      "@/app/test-auth-email/test-auth-email-form"
    );
    return <TestAuthEmailForm />;
  }
}
