export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-white">
      {children}
    </div>
  );
}
