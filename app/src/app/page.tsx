// Enhanced Landing Page - Beautiful gradients, task examples, and modern UI
import { HeroSection } from '../components/mainpage/hero-section'
import { MobileHeroSection } from '../components/mobile/MobileHeroSection'
import { MobileWelcomeBonus } from '../components/mobile/MobileWelcomeBonus'
import { RecentAvailableTasks } from '../components/mainpage/recent-available-tasks'
import { HomePublishedOfferings } from '../components/mainpage/home-published-offerings'
import { MobileTestimonials } from '../components/mobile/MobileTestimonials'
import { MobileHeroBanner } from '../components/mobile/MobileHeroBanner'
import { BlogArticlesSection } from '../components/blog/BlogArticlesSection'
import { HowItWorks } from '../components/mainpage/how-it-works'
import { Features } from '../components/mainpage/features'
import { Testimonials } from '../components/mainpage/testimonials'
import { TrustBadgesSection } from '../components/mainpage/TrustBadgesSection'
import { staticPageMetadata } from "@/lib/seo/staticPageMetadata";

export const generateMetadata = staticPageMetadata("/", {
  title: "JobPool — Get everyday tasks done",
  description:
    "Post tasks and hire verified taskers across India. Home services, repairs, delivery, and skilled help on JobPool.",
});

export default function Home() {
  return (
    <div className="flex min-w-0 w-full flex-col">
      {/* Mobile landing (default on small screens) */}
      <div className="md:hidden min-w-0 w-full">
        <MobileHeroSection />
        <TrustBadgesSection />
        <MobileWelcomeBonus />
        <RecentAvailableTasks variant="mobile" />
        <HomePublishedOfferings variant="mobile" />
        <MobileHeroBanner />
        <MobileTestimonials />
        <BlogArticlesSection />
      </div>

      {/* Desktop landing (md and up) */}
      <div className="hidden md:block">
        <HeroSection />
        <RecentAvailableTasks variant="desktop" />
        <HomePublishedOfferings variant="desktop" />
        <HowItWorks />
        <Features />
        <Testimonials />
        <BlogArticlesSection />
      </div>
    </div>
  )
}
