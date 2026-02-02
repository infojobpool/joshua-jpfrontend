"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight, Star, ThumbsUp, Check } from "lucide-react"

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

          {/* Right: Trust/safety visual with overlay cards (reference style) */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative aspect-[4/5] max-w-md mx-auto rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src="/images/caregiving-hero.jpg"
                alt="Trust and safety - JobPool"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 0vw, 448px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              {/* Overlay cards like reference */}
              <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <Image src="/images/ava-rahul.jpeg" alt="" width={40} height={40} className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    5.0 Overall Rating
                  </div>
                  <p className="text-xs text-gray-500">Trusted Tasker</p>
                </div>
              </div>
              <div className="absolute bottom-24 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
                <ThumbsUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">Job completed 2m ago</span>
              </div>
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">Payment released 2m ago</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
