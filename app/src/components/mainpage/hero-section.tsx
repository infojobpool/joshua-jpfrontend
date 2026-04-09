"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight, ThumbsUp, Check } from "lucide-react"
import useStore from "@/lib/Zustand"

export function HeroSection() {
  const checkAuth = useStore((s) => s.checkAuth)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  const firstName =
    user?.name?.trim().split(/\s+/)[0] || (isAuthenticated ? "there" : "")

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <section className="relative overflow-hidden bg-white pt-4 pb-16 md:pt-6 md:pb-20 lg:pt-8 lg:pb-24">
      <div className="w-full px-4 md:px-6 lg:px-10 xl:px-14 2xl:px-16 max-w-[90rem] mx-auto">
        {isAuthenticated && firstName ? (
          <p className="mb-5 text-center text-sm font-semibold text-slate-600 md:mb-6 md:text-base">
            Welcome back, {firstName}!
          </p>
        ) : null}
        <div className="grid gap-12 lg:gap-14 xl:gap-20 items-center lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.28fr)]">
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
            className="relative hidden lg:block w-full min-w-0"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Hero photo — storefront-style “make anything” creative display */}
            <div className="relative ml-auto w-full max-w-3xl xl:max-w-[44rem] 2xl:max-w-[52rem] aspect-[16/10] min-h-[17.5rem] xl:min-h-[22rem] 2xl:min-h-[26rem] rounded-3xl overflow-hidden bg-neutral-100 shadow-xl ring-1 ring-black/[0.06]">
              <Image
                src="/images/hero-home-make-anything.png"
                alt="Bold colorful display — make anything happen; post tasks on JobPool and get them done"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 0vw, (max-width: 1280px) 50vw, 820px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 xl:bottom-6 xl:left-6 xl:right-6 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 sm:gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-800">Task completed 2m ago</span>
                </div>
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 sm:gap-3">
                  <ThumbsUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-800">Payment released 2m ago</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
