"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight } from "lucide-react"

const heroCategories = [
  { title: "Gardening & landscaping", description: "Mulching, weeding and tidying up", image: "/images/image1.jpeg" },
  { title: "Painting", description: "Interior and exterior wall painting", image: "/images/image2.jpeg" },
  { title: "Handyperson", description: "Help with home maintenance", image: "/images/image1.jpeg" },
  { title: "Business & admin", description: "Help with accounting and tax returns", image: "/images/image2.jpeg" },
  { title: "Marketing & design", description: "Help with website", image: "/images/mobileapp.png" },
  { title: "Something else", description: "Wall mount art and paintings", image: "/images/image1.jpeg" },
  { title: "Removalists", description: "Packing, wrapping, moving and more!", image: "/images/image2.jpeg" },
  { title: "Home cleaning", description: "Clean, mop and tidy your house", image: "/images/image1.jpeg" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-16">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          {/* Left: Post your first task CTA */}
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl">
              Post your first
              <br />
              <span className="text-blue-600">task in seconds</span>
            </h1>
            <p className="mt-4 text-gray-600 text-base md:text-lg max-w-md">
              Save yourself hours and get your to-do list completed.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Describe what you need done",
                "Set your budget",
                "Receive quotes and pick the best Tasker",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
            <Link href="/post-task" className="mt-8 inline-flex">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-medium rounded-xl">
                Post your task
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: Category grid - compact cards */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {heroCategories.map((cat, i) => (
              <Link
                key={i}
                href="/browse-tasks"
                className="group flex flex-col bg-gray-50 rounded-lg overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-xs md:text-sm group-hover:text-blue-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-gray-500 text-[10px] md:text-xs mt-0.5 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
