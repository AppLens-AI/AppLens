import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StorySection from "@/components/StorySection";
import DemoVideoSection from "@/components/DemoVideoSection";
import TemplateCarousel from "@/components/TemplateCarousel";
import FeatureHighlights from "@/components/FeatureHighlights";
import SocialProofSection from "@/components/SocialProofSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <StorySection />
        <DemoVideoSection />
        <TemplateCarousel />
        <FeatureHighlights />
        <SocialProofSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
