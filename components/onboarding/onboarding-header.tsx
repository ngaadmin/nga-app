import Image from "next/image";
import Link from "next/link";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

export function OnboardingHeader() {
  return (
    <header
      className={cn(
        "sticky top-0 border-b border-nga-mist bg-white px-6 py-4",
        LAYER_CLASS.raised,
      )}
    >
      <div className="flex w-full items-center justify-center">
        <Link
          href="/"
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
