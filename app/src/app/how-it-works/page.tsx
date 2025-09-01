import { HowItWorksPage } from "../../components/mainpage/pages/how-it-works-page"
import { Navbar } from "../../components/mainpage/navbar"
import { Footer } from "../../components/mainpage/footer"

export default function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HowItWorksPage />
      </main>
      <Footer />
    </div>
  )
}
