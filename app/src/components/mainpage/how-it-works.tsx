// "use client"

// import { motion, useScroll, useTransform } from "framer-motion"
// import { useRef } from "react"
// import { ClipboardList, Users, CheckCircle, ArrowRight } from "lucide-react"

// export function HowItWorks() {
//   const containerRef = useRef(null)
//   const { scrollYProgress } = useScroll({
//     target: containerRef,
//     offset: ["start end", "end start"],
//   })

//   const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
//   const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, 100])

//   const steps = [
//     {
//       icon: <ClipboardList className="h-10 w-10 text-blue-600" />,
//       title: "Post your task",
//       description: "Describe what you need done, when and where you need it, and how much you'll pay.",
//     },
//     {
//       icon: <Users className="h-10 w-10 text-blue-600" />,
//       title: "Choose the best Tasker",
//       description: "Browse profiles, reviews, and offers. Chat with Taskers and select the best one for your task.",
//     },
//     {
//       icon: <CheckCircle className="h-10 w-10 text-blue-600" />,
//       title: "Get it done",
//       description: "Your Tasker completes the work and you release payment securely through our platform.",
//     },
//   ]

//   return (
//     <section id="how-it-works" className="py-20 bg-white" ref={containerRef}>
//       <motion.div className="container px-4 md:px-6" style={{ opacity, y }}>
//         <div className="text-center mb-16">
//           <motion.h2
//             className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
//             initial={{ opacity: 0, y: -20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             viewport={{ once: true }}
//           >
//             How TaskMaster works
//           </motion.h2>
//           <motion.p
//             className="mt-4 text-gray-500 md:text-xl max-w-3xl mx-auto"
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             viewport={{ once: true }}
//           >
//             Getting things done has never been easier
//           </motion.p>
//         </div>

//         <div className="grid md:grid-cols-3 gap-8 relative">
//           {steps.map((step, index) => (
//             <motion.div
//               key={index}
//               className="flex flex-col items-center text-center"
//               initial={{ opacity: 0, y: 50 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{
//                 duration: 0.5,
//                 delay: index * 0.2,
//               }}
//               viewport={{ once: true }}
//             >
//               <div className="relative">
//                 <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
//                   {step.icon}
//                 </div>
//                 <div className="absolute top-1/2 -translate-y-1/2 left-full w-full hidden md:block">
//                   {index < steps.length - 1 && <ArrowRight className="w-8 h-8 text-gray-300" />}
//                 </div>
//               </div>
//               <h3 className="text-xl font-bold mb-3">{step.title}</h3>
//               <p className="text-gray-500">{step.description}</p>
//             </motion.div>
//           ))}
//         </div>
//       </motion.div>
//     </section>
//   )
// }

"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ClipboardList, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  Star, 
  MessageCircle, 
  CreditCard,
  Smartphone,
  DollarSign,
  Clock,
  MapPin
} from "lucide-react"

export function HowItWorks() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, 100])

  const steps = [
    {
      icon: <ClipboardList className="h-10 w-10 text-blue-600" />,
      title: "1. Post Your Task",
      description: "Tell us what you need done and set your budget. It's completely free to post.",
      action: "Post your task for free",
      details: "Be specific about what you need - this helps helpers give you better offers."
    },
    {
      icon: <Users className="h-10 w-10 text-blue-600" />,
      title: "2. Get Offers & Choose",
      description: "Local helpers will send you offers. Check their profiles and reviews to pick the best one.",
      action: "Post your task for free",
      details: "All helpers are verified and rated by previous customers."
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-blue-600" />,
      title: "3. Get It Done",
      description: "Your helper completes the work. You pay only when you're satisfied with the results.",
      action: "Post your task for free",
      details: "Your payment is held safely until the task is completed to your satisfaction."
    },
  ]

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "JobPool's insurance cover",
      subtitle: "Public liability insurance",
      description: "JobPool Insurance covers you for any accidental injury to the customer or property damage whilst performing certain task activities",
      highlight: "Top rated insurance provided by reputable insurance brands"
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-600" />,
      title: "Ratings & reviews",
      description: "Review Tasker's portfolios, skills, badges on their profile, and see their transaction verified ratings, reviews & completion rating to see their reliability on tasks they've previously completed on JobPool.",
      highlight: "This empowers you to make sure you're choosing the right person for your task"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-blue-600" />,
      title: "Communication",
      description: "Use JobPool to stay in contact from the moment your task is posted until it's completed. Accept an offer and you can privately message the Tasker to discuss final details, and get your task completed.",
      highlight: "Get started for free"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-purple-600" />,
      title: "Payments on lock",
      subtitle: "JobPool Pay is the seamless and secure way to get your tasks completed",
      description: "Once you accept an offer on a task, the agreed upon amount is held secure with JobPool Pay until the task is complete. Once complete, you'll simply need to release the payment.",
      highlight: "Fast and hassle free payment • Cashless payments, no cash in hand • You are always in control"
    }
  ]

  const taskerBenefits = [
    {
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      title: "Download the JobPool App",
      description: "Download the JobPool App and get the tasks you need completed with just a tap of the button. You can also browse available tasks and earn money wherever you go!",
      highlight: "Earn up to ₹50,000 per month completing tasks"
    },
    {
      icon: <Clock className="h-8 w-8 text-green-600" />,
      title: "All on your terms",
      description: "Saw a job that fits your skills and timeframe? Go for it. JobPool's flexible to your schedule.",
      highlight: "Work when you want, where you want"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-yellow-600" />,
      title: "Payments on lock",
      description: "Nobody likes chasing money, so we secure customer payments upfront. When a task is marked complete, your bank account will know about it.",
      highlight: "Get paid quickly and securely"
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "Peace of mind, insured",
      description: "Liability insurance is sorted for Taskers performing most Tasks. JobPool Insurance is provided by reputable insurance brands.",
      highlight: "Work with confidence and protection"
    }
  ]

  return (
    <section id="how-it-works" className="py-12 bg-white" ref={containerRef}>
      <motion.div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16" style={{ opacity, y }}>
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Post a task. Get Offers. Get it done!
          </motion.h2>
          <motion.p
            className="mt-4 text-gray-500 md:text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            The best place for people and businesses to outsource tasks
          </motion.p>
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link href="/post-task">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Post a task for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Main Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.2,
              }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  {step.icon}
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 left-full w-full hidden md:block">
                  {index < steps.length - 1 && <ArrowRight className="w-8 h-8 text-gray-300" />}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-500 mb-4">{step.description}</p>
              <p className="text-sm text-gray-400 mb-4">{step.details}</p>
              <Link href="/post-task">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  {step.action}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* We love a to-do section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">We love a to-do</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            From odd jobs to serious renovations, the help you're looking for is on JobPool.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {['Cooking', 'Computer & IT', 'Photography', 'Removals', 'Design', 'Business', 'Handyman', 'Furniture Assembly'].map((category) => (
              <div key={category} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                {category}
              </div>
            ))}
          </div>
        </motion.div>

        {/* We've got you covered */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            We've got you covered
          </h3>
          <p className="text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            Whether you're posting a task or completing a task, you can do both with the peace of mind that JobPool is there to support.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 p-6 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                    {feature.subtitle && (
                      <p className="text-sm font-medium text-gray-700 mb-2">{feature.subtitle}</p>
                    )}
                    <p className="text-gray-600 mb-3">{feature.description}</p>
                    <p className="text-sm font-medium text-blue-600">{feature.highlight}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tasker Benefits */}
        <motion.div
          className="bg-blue-50 rounded-2xl p-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Earn Money as a Tasker</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of Taskers who are earning money by helping others with their tasks.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {taskerBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h4>
                    <p className="text-gray-600 mb-3">{benefit.description}</p>
                    <p className="text-sm font-medium text-green-600">{benefit.highlight}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/signup">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
                Join JobPool
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="ml-4 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg">
                Earn Money
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join JobPool today and start connecting with skilled professionals in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/post-task">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Post Your Task
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg">
                Become a Tasker
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}