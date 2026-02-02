"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const categories = [
  "Cooking",
  "Computer & IT",
  "Photography",
  "Removals",
  "Design",
  "Business",
  "Handyman",
  "Furniture Assembly",
  "Cleaning",
  "Gardening",
  "Delivery",
  "Events",
]

export function CategoryScroller() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const step = 280
    scrollRef.current.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" })
  }

  return (
    <section className="py-10 md:py-12 bg-white overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            We love a to-do
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            From odd jobs to serious renovations, the help you&apos;re looking for is on JobPool.
          </p>
        </motion.div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollSnapType: "x mandatory",
            }}
          >
            {categories.map((category) => (
              <Link
                key={category}
                href={`/browse?category=${encodeURIComponent(category.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-"))}`}
                className="flex-shrink-0 scroll-snap-start"
              >
                <motion.div
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-w-[140px] text-center border border-blue-100/80"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {category}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 z-10 hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 z-10 hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}
