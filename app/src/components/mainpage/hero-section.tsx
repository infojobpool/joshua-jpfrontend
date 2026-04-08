"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight, ThumbsUp, Check } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-4 pb-16 md:pt-6 md:pb-20 lg:pt-8 lg:pb-24">
      <div className="w-full px-4 md:px-6 lg:px-10 xl:px-14 2xl:px-16 max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-center">
          {/* Left: Post your first task CTA */}
          <motion.div
            className="flex flex-col justify-center max-w-xl"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl leading-tight">
              Post your first
              <br />
              <span className="text-blue-600">task in seconds</span>
            </h1>
            <p className="mt-6 text-gray-600 text-base md:text-lg max-w-md leading-relaxed">
              Save yourself hours and get your to-do list completed.
            </p>
            <ul className="mt-10 space-y-5">
              {[
                "Describe what you need done",
                "Set your budget",
                "Receive quotes and pick the best Tasker",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 text-base md:text-lg">{step}</span>
                </li>
              ))}
            </ul>
            <Link href="/post-task" className="mt-10 inline-flex">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-medium rounded-xl">
                Post your task
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: Hero image with overlay cards */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Hero illustration — desktop “GET EVERYTHING DONE” banner */}
            <div className="relative aspect-[4/3] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-[#0c2d6b] shadow-lg">
              <Image
                src="/images/desktop-hero-get-everything-done.png"
                alt="Get everything done — tasks, moving, cleaning, and more on JobPool"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 0vw, 672px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              {/* Task completed (left) & Payment released (right) – side by side */}
              <div className="absolute bottom-5 right-5 flex items-center gap-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">Task completed 2m ago</span>
                </div>
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
                  <ThumbsUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">Payment released 2m ago</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
