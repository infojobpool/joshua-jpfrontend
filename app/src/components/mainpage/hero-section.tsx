"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { ArrowRight, Star, ThumbsUp, Check, DollarSign, ShieldCheck } from "lucide-react"

const trustFeatures = [
  {
    icon: DollarSign,
    title: "Secure payments",
    description: "Funds are securely held until you confirm the task is completed properly.",
    href: "/help#payments",
  },
  {
    icon: Star,
    title: "Verified ratings and reviews",
    description: "Choose the best professionals by checking verified ratings from other clients.",
    href: "/help#reviews",
  },
  {
    icon: ShieldCheck,
    title: "Insurance for your peace of mind",
    description: "We provide liability insurance for all tasks.",
    href: "/help#insurance",
  },
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

          {/* Right: Person image with overlay cards + Trust and safety block (reference style) */}
          <motion.div
            className="relative hidden lg:flex lg:flex-col lg:gap-6"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Image with overlay cards - replaced with person-focused image */}
            <div className="relative aspect-[4/5] max-w-sm mx-auto w-full rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src="/images/ava-nisha.jpg"
                alt="Trust and safety - JobPool"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 0vw, 384px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <Image src="/images/ava-rahul.jpeg" alt="" width={36} height={36} className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    5.0 Overall Rating
                  </div>
                  <p className="text-[10px] text-gray-500">Trusted Tasker</p>
                </div>
              </div>
              <div className="absolute bottom-20 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-800">Task completed 2m ago</span>
              </div>
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-800">Payment released 2m ago</span>
              </div>
            </div>

            {/* Trust and safety measures block (reference) */}
            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Trust and safety measures to protect you
              </h2>
              <ul className="space-y-4 mb-6">
                {trustFeatures.map((item, i) => {
                  const Icon = item.icon
                  return (
                  <li key={i} className="flex gap-3">
                    <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-amber-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-gray-600 text-xs mt-0.5">{item.description}</p>
                      <Link href={item.href} className="text-blue-600 text-xs font-medium mt-1 inline-block hover:underline">
                        Learn more
                      </Link>
                    </div>
                  </li>
                  )
                })}
              </ul>
              <Link href="/post-task" className="block">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl py-6">
                  Post a task for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
