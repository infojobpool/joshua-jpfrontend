"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-16">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="max-w-2xl"
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
      </div>
    </section>
  )
}
