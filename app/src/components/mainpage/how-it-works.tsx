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
import { ClipboardList, Users, CheckCircle, ArrowRight } from "lucide-react"

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
      title: "Post your task",
      description: "Describe what you need done, when and where you need it, and how much you'll pay.",
    },
    {
      icon: <Users className="h-10 w-10 text-blue-600" />,
      title: "Choose the best Tasker",
      description: "Browse profiles, reviews, and offers. Chat with Taskers and select the best one for your task.",
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-blue-600" />,
      title: "Get it done",
      description: "Your Tasker completes the work and you release payment securely through our platform.",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white" ref={containerRef}>
      <motion.div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16" style={{ opacity, y }}>
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            How TaskMaster works
          </motion.h2>
          <motion.p
            className="mt-4 text-gray-500 md:text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Getting things done has never been easier
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
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
              <p className="text-gray-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}