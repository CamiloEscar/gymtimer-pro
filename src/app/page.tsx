import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { RecentWorkouts } from "@/components/landing/RecentWorkouts";
import { MostUsedWorkouts } from "@/components/landing/MostUsedWorkouts";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <RecentWorkouts />
      <MostUsedWorkouts />
    </main>
  );
}
