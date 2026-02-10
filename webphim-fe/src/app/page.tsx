import GuestNavbar from '@/components/layout/GuestNavbar';
import Hero from '@/components/landing/Hero';
import FeatureSections from '@/components/landing/FeatureSection';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/layout/Footer';

export default function LandingPage() {
  return (
    <div className="bg-netflix-black">
      <GuestNavbar />
      <Hero />
      <FeatureSections />
      <FAQ />
      <div className="border-t-[6px] border-netflix-dark-gray/60">
        <Footer />
      </div>
    </div>
  );
}
