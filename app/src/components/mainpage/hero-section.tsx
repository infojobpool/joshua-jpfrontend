"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight, ThumbsUp, Check } from "lucide-react"
import useStore from "@/lib/Zustand"
import { HomeSocialProofStats } from "@/components/mainpage/HomeSocialProofStats"

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
    <section className="relative overflow-hidden bg-white pb-10 pt-3 md:pb-12 md:pt-5 lg:pb-14 lg:pt-6">
      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-6 lg:px-10 xl:px-14 2xl:px-16">
        {isAuthenticated && firstName ? (
          <p className="mb-3 text-center text-sm font-semibold text-slate-600 md:mb-4 md:text-base">
            Welcome back, {firstName}!
          </p>
        ) : null}
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.28fr)] xl:gap-14">
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
            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600 md:mt-5 md:text-lg">
              Save yourself hours and get your to-do list completed.
            </p>
            <ul className="mt-6 space-y-3.5 md:mt-8 md:space-y-4">
              {[
                "Describe what you need done",
                "Set your budget",
                "Receive quotes and pick the best Tasker",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 md:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 md:h-11 md:w-11">
                    {i + 1}
                  </span>
                  <span className="text-base text-gray-700 md:text-lg">{step}</span>
                </li>
              ))}
            </ul>
            <Link href="/post-task" className="mt-7 inline-flex md:mt-9">
              <Button className="rounded-xl bg-blue-600 px-7 py-5 text-base font-medium text-white hover:bg-blue-700 md:px-8 md:py-6">
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

        <HomeSocialProofStats className="mt-8 border-t border-slate-100/90 pt-7 md:mt-10 md:pt-8" />
      </div>
    </section>
  )
}
