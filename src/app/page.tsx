import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ModesMarquee } from "@/components/landing/ModesMarquee";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WorkoutModes } from "@/components/landing/WorkoutModes";
import { CoachSection } from "@/components/landing/CoachSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ModesMarquee />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <WorkoutModes />
      <CoachSection />
      <Reveal>
        <FinalCta />
      </Reveal>
      <Footer />
    </main>
  );
}