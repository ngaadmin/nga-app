import { OnboardingHeader } from "@/components/onboarding";

export default function OnboardingFlowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <OnboardingHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        {children}
      </div>
    </>
  );
}
