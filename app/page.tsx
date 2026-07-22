import Hero from "@/components/Hero";
import BlindSpot from "@/components/BlindSpot";
import Pipeline from "@/components/Pipeline";
import PhonePreview from "@/components/PhonePreview";
import Catches from "@/components/Catches";
import Coverage from "@/components/Coverage";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
export default function Page() {
  return (
    <main>
      <Hero />
      <BlindSpot />
      <Pipeline />
      <PhonePreview />
      <Catches />
      <Coverage />
      <Waitlist />
      <Footer />
    </main>
  );
}
