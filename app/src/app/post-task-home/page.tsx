import { PostTaskPage } from "../../components/mainpage/pages/post-task-page"
import { Navbar } from "../../components/mainpage/navbar"
import { Footer } from "../../components/mainpage/footer"


export default function PostTask() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <PostTaskPage />
      </main>
      <Footer />
    </div>
  )
}
