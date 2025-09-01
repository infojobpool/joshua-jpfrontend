import { CategoriesPage } from "../../components/mainpage/pages/categories-page"
import { Navbar } from "../../components/mainpage/navbar"
import { Footer } from "../../components/mainpage/footer"

export default function Categories() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <CategoriesPage />
      </main>
      <Footer />
    </div>
  )
}
