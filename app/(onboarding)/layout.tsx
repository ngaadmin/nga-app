import { AppFooter } from "@/components/legal/app-footer";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-white">
      {children}
      <div className="px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-6xl">
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
