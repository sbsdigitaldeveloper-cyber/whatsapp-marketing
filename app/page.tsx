

import Testimonials from "@/components/marketing/Testimonials";
import FAQs from "@/components/marketing/FAQs";
import LogoMarquee from "@/components/marketing/logoMarquee";
import WhyWhatsApp from "@/components/marketing/WhyWhatsapp";
import Hero from "@/components/marketing/Hero";
import FeatureSection from "@/components/marketing/FeatureSection";
import Pricing from "@/components/marketing/Pricing";

import ImageTextSection from "@/components/marketing/ImageTextRight";

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900 font-sans">
      <Hero />
      <FeatureSection />
     <ImageTextSection
  title="Reach Thousands Instantly"
  description="Send bulk messages via WhatsApp to your customers in seconds."
  imageSrc="/images/heroimg.jpeg"
  buttonText="Learn More"
  buttonLink="/features/bulk-messaging"
/>
 <ImageTextSection
  title="Powerful Analytics"
  description="Track real-time delivery, read rates, and engagement with live dashboards."
  imageSrc="/images/heroimg.jpeg"
  buttonText="Explore Analytics"
  buttonLink="/features/analytics"
  reverse={true}
/>


      <WhyWhatsApp />
      <LogoMarquee />
      <Pricing/>
   
      <Testimonials />
      <FAQs />
    </div>
  );
}

