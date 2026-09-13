import { AppHeader } from "@/components/layout/AppHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ActiveRunFloater } from "@/components/layout/ActiveRunFloater";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="pb-16 md:pb-0">{children}</main>
      <ActiveRunFloater />
      <MobileTabBar />
      <InstallPromptBanner />
    </>
  );
}