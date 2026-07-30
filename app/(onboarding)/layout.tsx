import { OnboardingHeader } from "@/components/onboarding";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-white">
      <OnboardingHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        {children}
      </div>
    </div>
  );
}
