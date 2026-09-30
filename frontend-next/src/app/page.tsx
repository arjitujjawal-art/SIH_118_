import PublicNavbar from "@/components/layout/PublicNavbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/public/Hero";
import HomeExplodedSection from "@/components/public/HomeExplodedSection";
import PlatformAccess from "@/components/public/PlatformAccess";
import TeamSection from "@/components/public/TeamSection";
import FinalCTA from "@/components/public/FinalCTA";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1">
        {/* Order: Hero -> Interactive 3D Exploded Teardown & Integrated Workflow -> Platform Access -> Team -> Final CTA */}
        <Hero />
        <HomeExplodedSection />
        <PlatformAccess />
        <TeamSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
