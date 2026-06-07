import Image from "next/image";
import Link from "next/link";
import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
import { DASHBOARD_HOME_HREF, DASHBOARD_NAV_ITEMS } from "@/lib/dashboard/navigation";

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-nga-mist bg-white md:flex">
      <div className="flex flex-col items-center border-b border-nga-mist px-4 py-6">
        <Link
          href={DASHBOARD_HOME_HREF}
          className="inline-flex items-center justify-center focus-visible:outline-offset-4"
          aria-label="NextGenAchievers dashboard home"
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

      <nav
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-6"
        aria-label="Main navigation"
      >
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <DashboardNavLink key={item.id} item={item} variant="sidebar" />
        ))}
      </nav>
    </aside>
  );
}
