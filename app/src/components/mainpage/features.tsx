// "use client"

// import { motion, useScroll, useTransform } from "framer-motion"
// import { useRef } from "react"
// import Image from "next/image"
// import { Shield, Clock, DollarSign, Users } from "lucide-react"

// export function Features() {
//   const containerRef = useRef(null)
//   const { scrollYProgress } = useScroll({
//     target: containerRef,
//     offset: ["start end", "end start"],
//   })

//   const features = [
//     {
//       icon: <Shield className="h-10 w-10 text-blue-600" />,
//       title: "Secure Payments",
//       description: "Your payment is held securely until the task is completed to your satisfaction.",
//     },
//     {
//       icon: <Clock className="h-10 w-10 text-blue-600" />,
//       title: "Save Time",
//       description: "Focus on what matters most to you and let our Taskers handle the rest.",
//     },
//     {
//       icon: <DollarSign className="h-10 w-10 text-blue-600" />,
//       title: "Competitive Pricing",
//       description: "Set your budget and get offers from skilled Taskers within your price range.",
//     },
//     {
//       icon: <Users className="h-10 w-10 text-blue-600" />,
//       title: "Verified Taskers",
//       description: "All Taskers go through a verification process to ensure quality and reliability.",
//     },
//   ]

//   const imageX = useTransform(scrollYProgress, [0, 1], [100, -100])

//   return (
//     <section className="py-20 bg-slate-50" ref={containerRef}>
//       <div className="container px-4 md:px-6">
//         <div className="grid lg:grid-cols-2 gap-12 items-center">
//           <div className="space-y-8">
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5 }}
//               viewport={{ once: true }}
//             >
//               <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Why choose Jobpool?</h2>
//               <p className="mt-4 text-gray-500 md:text-xl">
//                 Our platform connects you with skilled professionals to get your tasks done efficiently.
//               </p>
//             </motion.div>

//             <div className="grid sm:grid-cols-2 gap-6">
//               {features.map((feature, index) => (
//                 <motion.div
//                   key={index}
//                   className="bg-white p-6 rounded-xl shadow-md"
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   transition={{
//                     duration: 0.5,
//                     delay: index * 0.1,
//                   }}
//                   viewport={{ once: true }}
//                   whileHover={{
//                     y: -5,
//                     boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                   }}
//                 >
//                   <div className="p-3 bg-blue-50 rounded-full inline-block mb-4">{feature.icon}</div>
//                   <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
//                   <p className="text-gray-500">{feature.description}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>

//           <motion.div className="relative h-[500px] rounded-xl overflow-hidden shadow-xl" style={{ x: imageX }}>
//             <Image
//               src="/images/image2.jpeg"
//               fill
//               alt="TaskMaster features"
//               className="object-cover"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
//               <div className="p-8 text-white">
//                 <h3 className="text-2xl font-bold mb-2">Join our community</h3>
//                 <p className="text-white/80">Connect with thousands of Taskers and customers in your area</p>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </section>
//   )
// }

"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { Shield, Clock, DollarSign, Users } from "lucide-react"

export function Features() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const features = [
    {
      icon: <Shield className="h-10 w-10 text-blue-600" />,
      title: "Safe & Secure",
      description: "Your money is protected until the work is done to your satisfaction.",
    },
    {
      icon: <Clock className="h-10 w-10 text-blue-600" />,
      title: "Quick & Easy",
      description: "Post a task in minutes and get it done by local helpers.",
    },
    {
      icon: <DollarSign className="h-10 w-10 text-blue-600" />,
      title: "Fair Pricing",
      description: "Set your budget and get offers from helpers in your price range.",
    },
    {
      icon: <Users className="h-10 w-10 text-blue-600" />,
      title: "Trusted Helpers",
      description: "All helpers are verified and rated by previous customers.",
    },
  ]

  const imageX = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <section className="py-12 bg-slate-50" ref={containerRef}>
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Why Choose JobPool?</h2>
              <p className="mt-4 text-gray-500 md:text-xl">
                Safe, reliable, and easy to use - everything you need to get tasks done.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
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

          <motion.div className="relative h-[500px] rounded-xl overflow-hidden shadow-xl" style={{ x: imageX }}>
            <Image
              src="/images/image2.jpeg"
              fill
              alt="TaskMaster features"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Join our community</h3>
                <p className="text-white/80">Connect with thousands of Taskers and customers in your area</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}