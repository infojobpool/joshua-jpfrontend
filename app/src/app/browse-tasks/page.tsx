import { BrowseTasksPage } from "../../components/mainpage/pages/browse-tasks-page"
import { Navbar } from "../../components/mainpage/navbar"
import { Footer } from "../../components/mainpage/footer"

export default function BrowseTasks() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <BrowseTasksPage />
      </main>
      <Footer />
    </div>
  )
}
