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
    <section className="relative overflow-hidden bg-white py-16 md:py-20 lg:py-24">
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

          {/* Right: Tasker helping taskmaster – image + overlay cards + Trust and safety block */}
          <motion.div
            className="relative hidden lg:flex lg:flex-col lg:gap-8"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Image: tasker doing work, taskmaster getting help */}
            <div className="relative aspect-[4/3] w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              <Image
                src="/images/image2.jpeg"
                alt="Tasker helping with your task – get help from skilled professionals"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 0vw, 512px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
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
              <div className="absolute bottom-24 left-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">Task completed 2m ago</span>
              </div>
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
                <ThumbsUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">Payment released 2m ago</span>
              </div>
            </div>

            {/* Trust and safety measures block */}
            <div className="bg-gray-50/90 rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Trust and safety measures to protect you
              </h2>
              <ul className="space-y-5 mb-8">
                {trustFeatures.map((item, i) => {
                  const Icon = item.icon
                  return (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-amber-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base">{item.title}</h3>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{item.description}</p>
                      <Link href={item.href} className="text-blue-600 text-sm font-medium mt-1.5 inline-block hover:underline">
                        Learn more
                      </Link>
                    </div>
                  </li>
                  )
                })}
              </ul>
              <Link href="/post-task" className="block">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl py-6 text-base">
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
