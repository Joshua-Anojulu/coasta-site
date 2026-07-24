import Hero from "@/components/Hero";
import BlindSpot from "@/components/BlindSpot";
import HowItWorks from "@/components/HowItWorks";
import Pipeline from "@/components/Pipeline";
import PhonePreview from "@/components/PhonePreview";
import Catches from "@/components/Catches";
import Coverage from "@/components/Coverage";
import TrustBand from "@/components/TrustBand";
import Faq from "@/components/Faq";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main>
      <Hero />
      <div className="lane-divider" />
      <BlindSpot />
      <HowItWorks />
      <Pipeline />
      <div className="lane-divider" />
      <PhonePreview />
      <Catches />
      <div className="lane-divider" />
      <Coverage />
      <TrustBand />
      <Faq />
      <Waitlist />
      <Footer />
    </main>
  );
}
