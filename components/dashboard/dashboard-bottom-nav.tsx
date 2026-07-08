import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
import { DASHBOARD_NAV_ITEMS } from "@/lib/dashboard/navigation";

export function DashboardBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-chrome flex border-t border-nga-mist bg-white md:hidden"
      aria-label="Main navigation"
    >
      {DASHBOARD_NAV_ITEMS.map((item) => (
        <DashboardNavLink key={item.id} item={item} variant="bottom" />
      ))}
    </nav>
  );
}
