// Enhanced Landing Page - Beautiful gradients, task examples, and modern UI
import { HeroSection } from '../components/mainpage/hero-section'
import { Stats } from '../components/mainpage/stats'
import { TaskExamples } from '../components/mainpage/task-examples'
import { HowItWorks } from '../components/mainpage/how-it-works'
import { Features } from '../components/mainpage/features'
import { Testimonials } from '../components/mainpage/testimonials'
import { Categories } from '../components/mainpage/categories'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <Stats />
      <TaskExamples />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Categories />
    </div>
  )
}
