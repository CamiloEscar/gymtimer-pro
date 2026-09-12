import { AppHeader } from "@/components/layout/AppHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ActiveDisplayFloater } from "@/components/layout/ActiveDisplayFloater";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="pb-16 md:pb-0">{children}</main>
      <ActiveDisplayFloater />
      <MobileTabBar />
    </>
  );
}