import Image from "next/image";
import Link from "next/link";

export function OnboardingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-nga-mist bg-white px-6 py-4">
      <div className="flex w-full items-center justify-center">
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center focus-visible:outline-offset-4"
          aria-label="NextGenAchievers home"
        >
          <Image
            src="/nga-logo.png"
            alt="NextGenAchievers Logo"
            height={40}
            width={160}
            className="object-contain"
            unoptimized
          />
        </Link>
      </div>
    </header>
  );
}
