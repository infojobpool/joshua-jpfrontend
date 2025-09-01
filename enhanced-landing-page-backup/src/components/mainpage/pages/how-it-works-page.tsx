"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
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

export function HowItWorksPage() {
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
      title: "Choose the best Tasker",
      description: "Browse profiles, reviews, and offers. Chat with Taskers and select the best one for your task.",
      details: [
        "Review Tasker profiles and ratings",
        "Compare offers and prices",
        "Ask questions through our messaging system",
        "Check availability and expertise",
        "Select the Tasker that best fits your needs",
      ],
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-blue-600" />,
      title: "Get it done",
      description: "Your Tasker completes the work and you release payment securely through our platform.",
      details: [
        "Communicate with your Tasker",
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
      description: "Sign up as a Tasker, complete your profile with skills, experience, and availability.",
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
      title: "Verified Taskers",
      description: "All Taskers go through a verification process to ensure quality and reliability.",
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
        "Posting a task on TaskMaster is completely free. You only pay when you accept an offer from a Tasker and the task is completed to your satisfaction.",
    },
    {
      question: "How do I know if a Tasker is reliable?",
      answer:
        "All Taskers on our platform have verified profiles and ratings from previous tasks. You can review their profile, ratings, and completed task history before accepting their offer.",
    },
    {
      question: "What happens if the task isn't completed properly?",
      answer:
        "If you're not satisfied with the work, you can discuss it with your Tasker first. If you can't reach a resolution, our customer support team can help mediate. Your payment is held securely until you're satisfied with the work.",
    },
    {
      question: "How do I become a Tasker?",
      answer:
        "To become a Tasker, sign up on our platform, complete your profile with your skills and experience, set your rates, and start making offers on tasks that match your expertise.",
    },
    {
      question: "How much can I earn as a Tasker?",
      answer:
        "Your earnings depend on the types of tasks you complete, your rates, and how many tasks you take on. Many of our Taskers earn a competitive income, either part-time or full-time.",
    },
    {
      question: "Is TaskMaster available in my area?",
      answer:
        "TaskMaster is currently available in major cities across the India with plans to expand to more locations soon. Check our website or app to see if we're in your area.",
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
      <section className="bg-slate-50 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">How TaskMaster Works</h1>
            <p className="mt-4 text-xl text-gray-500">Your guide to getting tasks done or earning money as a Tasker</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <Tabs defaultValue="poster" className="w-full">
            <TabsList className="mb-8 flex justify-center">
              <TabsTrigger value="poster" className="px-8 py-3">
                For Task Posters
              </TabsTrigger>
              <TabsTrigger value="tasker" className="px-8 py-3">
                For Taskers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="poster" className="mt-0">
              <div className="grid gap-16">
                <motion.div
                  className="grid md:grid-cols-3 gap-8 relative"
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
                  className="grid md:grid-cols-2 gap-12 items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="relative h-[400px] rounded-xl overflow-hidden">
                    <Image
                      src="images/placeholder.svg?height=400&width=600"
                      fill
                      alt="Post a task"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Tips for posting a great task</h2>
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
              <div className="grid gap-16">
                <motion.div
                  className="grid md:grid-cols-3 gap-8 relative"
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
                  className="grid md:grid-cols-2 gap-12 items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Tips for successful Taskers</h2>
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
                  <div className="relative h-[400px] rounded-xl overflow-hidden">
                    <Image
                      src="images/placeholder.svg?height=400&width=600"
                      fill
                      alt="Become a Tasker"
                      className="object-cover"
                    />
                  </div>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why choose TaskMaster?</h2>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
              Our platform makes it easy to get things done and earn money on your own terms
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
        <div className="container px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
              Find answers to common questions about TaskMaster
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
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to get started?</h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of satisfied customers and Taskers on TaskMaster today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/post-task">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto">
                    Post a Task
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Become a Tasker
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative h-[400px]"
            >
              <Image
                src="images/placeholder.svg?height=400&width=600"
                fill
                alt="TaskMaster"
                className="object-cover rounded-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
