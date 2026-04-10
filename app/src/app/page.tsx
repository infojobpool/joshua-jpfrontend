// Enhanced Landing Page - Beautiful gradients, task examples, and modern UI
import { HeroSection } from '../components/mainpage/hero-section'
import { MobileHeroSection } from '../components/mobile/MobileHeroSection'
import { MobileWelcomeBonus } from '../components/mobile/MobileWelcomeBonus'
import { RecentAvailableTasks } from '../components/mainpage/recent-available-tasks'
import { HomePublishedOfferings } from '../components/mainpage/home-published-offerings'
import { MobileTestimonials } from '../components/mobile/MobileTestimonials'
import { MobileWhyChoose } from '../components/mobile/MobileWhyChoose'
import { MobileEarnAsTasker } from '../components/mobile/MobileEarnAsTasker'
import { MobileShowcase } from '../components/mobile/MobileShowcase'
import { MobileHeroBanner } from '../components/mobile/MobileHeroBanner'
import { HowItWorks } from '../components/mainpage/how-it-works'
import { Features } from '../components/mainpage/features'
import { Testimonials } from '../components/mainpage/testimonials'
import { TrustBadgesSection } from '../components/mainpage/TrustBadgesSection'
import { MobileWrapper } from '../components/mobile/MobileWrapper'

export default function Home() {
  return (
    <div className="flex min-h-screen min-w-0 w-full flex-col">
      {/* Mobile landing (default on small screens) */}
      <div className="md:hidden min-w-0 w-full">
        <MobileHeroSection />
        <MobileWelcomeBonus />
        <RecentAvailableTasks variant="mobile" />
        <HomePublishedOfferings variant="mobile" />
        <MobileHeroBanner />
        <MobileShowcase />
        <MobileEarnAsTasker />
        <MobileWhyChoose />
        <MobileTestimonials />
      </div>

      {/* Desktop landing (md and up) */}
      <div className="hidden md:block">
        <HeroSection />
        <TrustBadgesSection />
        <RecentAvailableTasks variant="desktop" />
        <HomePublishedOfferings variant="desktop" />
        <HowItWorks />
        <Features />
        <Testimonials />
      </div>
    </div>
  )
}
