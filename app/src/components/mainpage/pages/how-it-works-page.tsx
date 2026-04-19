"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "../../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  ClipboardList,
  Users,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Shield,
  Star,
  MessageCircle,
  Calendar,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../components/ui/accordion"

const HERO_SLIDES = [
  {
    src: "/images/how-it-works-start-title.png",
    alt: "Post a task: start with a short title, like Guitar Classes",
  },
  {
    src: "/images/how-it-works-budget-slide.png",
    alt: "Set your rough budget when posting a task",
  },
] as const

export function HowItWorksPage() {
  const [heroSlide, setHeroSlide] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (heroPaused) return
    const id = window.setInterval(() => {
      setHeroSlide((i) => (i + 1) % HERO_SLIDES.length)
    }, 5500)
    return () => window.clearInterval(id)
  }, [heroPaused])

  const goHeroSlide = useCallback((index: number) => {
    if (index >= 0 && index < HERO_SLIDES.length) setHeroSlide(index)
  }, [])
  const posterSteps = [
    {
      icon: <ClipboardList className="h-12 w-12 text-blue-600" />,
      title: "Post your task",
      description: "Describe what you need done, when and where you need it, and how much you'll pay.",
      details: [
        "Be specific about your requirements",
        "Set a realistic budget",
        "Include photos if relevant",
        "Specify the date and time",
        "Add your location or mark as remote",
      ],
    },
    {
      icon: <Users className="h-12 w-12 text-blue-600" />,
      title: "Choose the best Helper",
      description: "Browse profiles, reviews, and offers. Chat with Helpers and select the best one for your task.",
      details: [
        "Review Helper profiles and ratings",
        "Compare offers and prices",
        "Ask questions through our messaging system",
        "Check availability and expertise",
        "Select the Helper that best fits your needs",
      ],
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-blue-600" />,
      title: "Get it done",
      description: "Your Helper completes the work and you release payment securely through our platform.",
      details: [
        "Communicate with your Helper",
        "Track progress through the app",
        "Inspect the completed work",
        "Release payment when satisfied",
        "Leave a review to help the community",
      ],
    },
  ]

  const taskerSteps = [
    {
      icon: <Users className="h-12 w-12 text-blue-600" />,
      title: "Create your profile",
      description: "Sign up as a Helper, complete your profile with skills, experience, and availability.",
      details: [
        "Add a professional photo",
        "Highlight your skills and experience",
        "Set your working hours and availability",
        "Specify your service area",
        "Complete verification checks",
      ],
    },
    {
      icon: <ClipboardList className="h-12 w-12 text-blue-600" />,
      title: "Find tasks",
      description: "Browse available tasks in your area and make offers on the ones that match your skills.",
      details: [
        "Filter tasks by category and location",
        "Read task descriptions carefully",
        "Make competitive offers",
        "Explain why you're the right person for the job",
        "Respond promptly to questions",
      ],
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-blue-600" />,
      title: "Complete tasks and get paid",
      description: "Do great work, build your reputation, and receive secure payment through our platform.",
      details: [
        "Arrive on time and prepared",
        "Communicate professionally",
        "Complete the task to a high standard",
        "Ask for a review upon completion",
        "Receive payment directly to your account",
      ],
    },
  ]

  const features = [
    {
      icon: <Shield className="h-10 w-10 text-blue-600" />,
      title: "Secure Payments",
      description: "Your payment is held securely until the task is completed to your satisfaction.",
    },
    {
      icon: <Star className="h-10 w-10 text-blue-600" />,
      title: "Verified Helpers",
      description: "All Helpers go through a verification process to ensure quality and reliability.",
    },
    {
      icon: <MessageCircle className="h-10 w-10 text-blue-600" />,
      title: "Messaging System",
      description: "Our built-in messaging system makes communication between parties easy and secure.",
    },
    {
      icon: <DollarSign className="h-10 w-10 text-blue-600" />,
      title: "No Hidden Fees",
      description: "Transparent pricing with no surprises. What you agree to is what you pay.",
    },
  ]

  const faqs = [
    {
      question: "How much does it cost to post a task?",
      answer:
        "Posting a task on JobPool is completely free. You only pay when you accept an offer from a Helper and the task is completed to your satisfaction.",
    },
    {
      question: "How do I know if a Helper is reliable?",
      answer:
        "All Helpers on our platform have verified profiles and ratings from previous tasks. You can review their profile, ratings, and completed task history before accepting their offer.",
    },
    {
      question: "What happens if the task isn't completed properly?",
      answer:
        "If you're not satisfied with the work, you can discuss it with your Helper first. If you can't reach a resolution, our customer support team can help mediate. Your payment is held securely until you're satisfied with the work.",
    },
    {
      question: "How do I become a Helper?",
      answer:
        "To become a Helper, sign up on our platform, complete your profile with your skills and experience, set your rates, and start making offers on tasks that match your expertise.",
    },
    {
      question: "How much can I earn as a Helper?",
      answer:
        "Your earnings depend on the types of tasks you complete, your rates, and how many tasks you take on. Many of our Helpers earn a competitive income, either part-time or full-time.",
    },
    {
      question: "Is JobPool available in my area?",
      answer:
        "JobPool is currently available in major cities across India with plans to expand to more locations soon. Check our website or app to see if we're in your area.",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 sm:py-10 md:py-16">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <motion.div
              className="flex flex-col justify-center space-y-3 sm:space-y-4 order-2 lg:order-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div className="space-y-1 sm:space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <motion.h1
                  className="text-2xl sm:text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl/none"
                  style={{ color: "#0a2463" }}
                >
                  How JobPool Works
                </motion.h1>
                <p className="max-w-[600px] text-gray-700 text-sm sm:text-base md:text-xl mb-1">
                  Simple steps to get tasks done or earn money as a Helper.
                </p>
                <p className="max-w-[600px] text-gray-600 text-sm sm:text-lg">
                  Post a task. Get offers. Get it done. Or help others and earn money.
                </p>
              </motion.div>

              <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Link href="/post-task" className="w-full sm:w-auto">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg">
                    Post Your First Task
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg"
                  >
                    Become a Helper
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-white rounded-lg shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Quick Start Guide</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mx-auto mb-1 sm:mb-2">1</div>
                    <p className="text-xs sm:text-sm font-medium">Post your task</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mx-auto mb-1 sm:mb-2">2</div>
                    <p className="text-xs sm:text-sm font-medium">Choose a Helper</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mx-auto mb-1 sm:mb-2">3</div>
                    <p className="text-xs sm:text-sm font-medium">Get it done</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex items-center justify-center lg:justify-end order-1 lg:order-2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 }}
            >
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-1 sm:px-0">
                <div
                  className="absolute inset-0 -m-3 sm:-m-5 rounded-[2rem] opacity-95 blur-[0.5px]"
                  style={{
                    background:
                      "repeating-conic-gradient(from -8deg at 50% 45%, #1d4ed8 0deg 18deg, #faf6ec 18deg 36deg)",
                  }}
                  aria-hidden
                />
                <div
                  className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10"
                  onMouseEnter={() => setHeroPaused(true)}
                  onMouseLeave={() => setHeroPaused(false)}
                >
                  <div className="relative aspect-[866/1024] w-full">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.div
                        key={heroSlide}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.38 }}
                      >
                        <Image
                          src={HERO_SLIDES[heroSlide].src}
                          alt={HERO_SLIDES[heroSlide].alt}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 42vw, 520px"
                          priority={heroSlide === 0}
                          draggable={false}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div
                    className="flex justify-center gap-2 border-t border-slate-100 bg-white py-2.5"
                    role="tablist"
                    aria-label="Hero illustration slides"
                  >
                    {HERO_SLIDES.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={heroSlide === i}
                        aria-label={`Slide ${i + 1}`}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                          heroSlide === i ? "bg-blue-600" : "bg-slate-300 hover:bg-slate-400",
                        )}
                        onClick={() => goHeroSlide(i)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 md:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <Tabs defaultValue="poster" className="w-full">
            <TabsList className="mb-6 sm:mb-8 flex flex-wrap justify-center gap-2 w-full sm:w-auto">
              <TabsTrigger value="poster" className="flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base">
                For Task Posters
              </TabsTrigger>
              <TabsTrigger value="tasker" className="flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base">
                For Helpers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="poster" className="mt-0">
              <div className="grid gap-10 sm:gap-16">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 relative"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {posterSteps.map((step, index) => (
                    <motion.div key={index} className="flex flex-col items-center text-center" variants={itemVariants}>
                      <div className="relative">
                        <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                          {step.icon}
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-full w-full hidden md:block">
                          {index < posterSteps.length - 1 && <ArrowRight className="w-8 h-8 text-gray-300" />}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-gray-500 mb-6">{step.description}</p>
                      <ul className="text-left space-y-2 text-gray-600">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="flex justify-center">
                  <Link href="/post-task">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                      Post Your First Task
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="relative w-full max-w-lg mx-auto order-2 md:order-1">
                    <div
                      className="absolute inset-0 -m-2 sm:-m-3 rounded-2xl opacity-95"
                      style={{
                        background:
                          "repeating-conic-gradient(from 12deg at 50% 40%, #1d4ed8 0deg 18deg, #faf6ec 18deg 36deg)",
                      }}
                      aria-hidden
                    />
                    <div className="relative overflow-hidden rounded-xl shadow-xl ring-1 ring-slate-900/10 bg-white">
                      <Image
                        src="/images/how-it-works-job-completed.png"
                        width={866}
                        height={1024}
                        alt="Job completed: release payment when the task is done to your satisfaction"
                        className="w-full h-auto object-cover object-top"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                  <div className="order-1 md:order-2 max-w-xl mx-auto md:mx-0 lg:max-w-none">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                      Tips for posting — and paying when you are happy
                    </h2>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Be specific about timing</h3>
                          <p className="text-gray-500">Include the date, time, and expected duration of your task.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Set a realistic budget</h3>
                          <p className="text-gray-500">Research similar tasks to understand the fair market rate.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <ClipboardList className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Provide clear details</h3>
                          <p className="text-gray-500">
                            The more information you provide, the better offers you'll receive.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Respond promptly</h3>
                          <p className="text-gray-500">
                            Quick responses help secure the best Taskers before they're booked.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="tasker" className="mt-0">
              <div className="grid gap-10 sm:gap-16">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 relative"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {taskerSteps.map((step, index) => (
                    <motion.div key={index} className="flex flex-col items-center text-center" variants={itemVariants}>
                      <div className="relative">
                        <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                          {step.icon}
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-full w-full hidden md:block">
                          {index < taskerSteps.length - 1 && <ArrowRight className="w-8 h-8 text-gray-300" />}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-gray-500 mb-6">{step.description}</p>
                      <ul className="text-left space-y-2 text-gray-600">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="flex justify-center">
                  <Link href="/signup">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                      Become a Tasker
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Tips for successful Taskers</h2>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <Star className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Build your reputation</h3>
                          <p className="text-gray-500">
                            Always deliver high-quality work and ask for reviews after each task.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Communicate professionally</h3>
                          <p className="text-gray-500">Keep clients informed and respond promptly to messages.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Be reliable</h3>
                          <p className="text-gray-500">
                            Always arrive on time and complete tasks within the agreed timeframe.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Set clear expectations</h3>
                          <p className="text-gray-500">Be transparent about what you can deliver and by when.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="relative w-full aspect-[4/3] md:h-[400px] rounded-xl overflow-hidden">
                    <Image
                      src="/images/eldercare.JPG"
                      fill
                      alt="Become a Tasker - help others and earn"
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why choose JobPool?</h2>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
              Our platform makes it easy to get things done and earn money on your own terms
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="p-3 bg-blue-50 rounded-full inline-block mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
              Find answers to common questions about JobPool
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-gray-500">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to get started?</h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of satisfied customers and Helpers on JobPool today.
              </p>
              <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:justify-start">
                <Link href="/post-task" className="sm:inline-flex">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto">
                    Post a Task
                  </Button>
                </Link>
                <Link href="/signup" className="sm:inline-flex">
                  <Button
                    variant="outline"
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Become a Helper
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative w-full aspect-[4/3] md:h-[400px] rounded-xl overflow-hidden"
            >
              <Image
                src="/images/image1.jpeg"
                fill
                alt="JobPool - get started"
                className="object-cover rounded-xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
