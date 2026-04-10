"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRef } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Monitor,
  Camera,
  Truck,
  Palette,
  Briefcase,
  Wrench,
  Box,
  Sparkles,
  Flower2,
  Package,
  PartyPopper,
} from "lucide-react"

const categories = [
  { name: "Cooking", icon: Utensils },
  { name: "Computer & IT", icon: Monitor },
  { name: "Photography", icon: Camera },
  { name: "Removals", icon: Truck },
  { name: "Design", icon: Palette },
  { name: "Business", icon: Briefcase },
  { name: "Handyman", icon: Wrench },
  { name: "Furniture Assembly", icon: Box },
  { name: "Cleaning", icon: Sparkles },
  { name: "Gardening", icon: Flower2 },
  { name: "Delivery", icon: Package },
  { name: "Events", icon: PartyPopper },
]

export function CategoryScroller() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const step = 220
    scrollRef.current.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" })
  }

  const slug = (name: string) =>
    name.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-")

  return (
    <section className="pt-8 pb-12 md:pt-10 md:pb-14 bg-white overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-7xl mx-auto">
        {/* Categories up and top – heading */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="font-home-section-title text-2xl text-gray-900 md:text-3xl lg:text-[2rem] mb-3">
            Browse by category
          </h2>
          <p className="font-home-section-desc text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Explore open tasks and people offering help across the skills booked most often on JobPool.
          </p>
        </motion.div>

        {/* Horizontal scroller – bigger cards with icons */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollSnapType: "x mandatory",
            }}
          >
            {categories.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                href={`/browse?category=${encodeURIComponent(slug(name))}`}
                className="flex-shrink-0 scroll-snap-start"
              >
                <motion.div
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl min-w-[160px] md:min-w-[180px] px-6 py-5 flex flex-col items-center justify-center gap-3 border border-blue-100/80 transition-colors shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 text-blue-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm md:text-base font-semibold text-center leading-tight">
                    {name}
                  </span>
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
