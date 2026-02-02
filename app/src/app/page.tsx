// Enhanced Landing Page - Beautiful gradients, task examples, and modern UI
import { HeroSection } from '../components/mainpage/hero-section'
import { MobileHeroSection } from '../components/mobile/MobileHeroSection'
import { MobileServiceScroller } from '../components/mobile/MobileServiceScroller'
import { MobileTestimonials } from '../components/mobile/MobileTestimonials'
import { MobileShowcase } from '../components/mobile/MobileShowcase'
import { MobileHeroBanner } from '../components/mobile/MobileHeroBanner'
import { HowItWorks } from '../components/mainpage/how-it-works'
import { Features } from '../components/mainpage/features'
import { Testimonials } from '../components/mainpage/testimonials'
import { FeaturedServices } from '../components/mainpage/featured-services'
import { MobileWrapper } from '../components/mobile/MobileWrapper'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile landing (default on small screens) */}
      <div className="md:hidden">
        <MobileHeroSection />
        <MobileServiceScroller />
        <MobileHeroBanner />
        <MobileShowcase />
        <MobileTestimonials />
      </div>

      {/* Desktop landing (md and up) */}
      <div className="hidden md:block">
        <HeroSection />
        <FeaturedServices />
        <HowItWorks />
        <Features />
        <Testimonials />
      </div>
    </div>
  )
}
