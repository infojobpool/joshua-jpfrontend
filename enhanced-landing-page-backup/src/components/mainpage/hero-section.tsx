// "use client"

// import { useState } from "react"
// import Image from "next/image"
// import Link from "next/link"
// import { motion } from "framer-motion"
// import { Button } from "../../components/ui/button"
// import { Input } from "../../components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
// import { ArrowRight, Search } from "lucide-react"

// export function HeroSection() {
//   const [taskType, setTaskType] = useState("")

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.2,
//         delayChildren: 0.3,
//       },
//     },
//   }

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 100, damping: 10 },
//     },
//   }

//   const headingVariants = {
//     hidden: { opacity: 0, scale: 0.9 },
//     visible: {
//       opacity: 1,
//       scale: 1,
//       transition: {
//         type: "spring",
//         stiffness: 100,
//         damping: 10,
//         delay: 0.2,
//       },
//     },
//   }

//   return (
//     <section className="relative overflow-hidden bg-slate-50 py-16 md:py-24">
//       <div className="container px-4 md:px-6">
//         <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
//           <motion.div
//             className="flex flex-col justify-center space-y-4"
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//           >
//             <motion.div className="space-y-2" variants={itemVariants}>
//               <motion.h1
//                 className="text-5xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none"
//                 variants={headingVariants}
//                 style={{
//                   transform: "rotate(-5deg)",
//                   color: "#0a2463",
//                 }}
//               >
//                 GET MORE
//                 <br />
//                 DONE
//               </motion.h1>
//               <motion.p className="max-w-[600px] text-gray-700 md:text-xl" variants={itemVariants}>
//                 Post any task. Pick the best person. Get it done now.
//               </motion.p>
//             </motion.div>

//             <motion.div className="flex flex-col sm:flex-row gap-4 mt-6" variants={itemVariants}>
//               <Link href="/post-task" className="w-full sm:w-auto">
//                 <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
//                   Post your task for free
//                   <ArrowRight className="ml-2 h-5 w-5" />
//                 </Button>
//               </Link>
//               <Link href="/signup" className="w-full sm:w-auto">
//                 <Button
//                   variant="outline"
//                   className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
//                 >
//                   Earn money as a Tasker
//                   <ArrowRight className="ml-2 h-5 w-5" />
//                 </Button>
//               </Link>
//             </motion.div>

//             <motion.div className="mt-8 p-4 bg-white rounded-lg shadow-md" variants={itemVariants}>
//               <h3 className="text-lg font-medium mb-3">What do you need help with?</h3>
//               <div className="flex flex-col sm:flex-row gap-3">
//                 <Select value={taskType} onValueChange={setTaskType}>
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select task type" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="moving">Help me move</SelectItem>
//                     <SelectItem value="cleaning">House cleaning</SelectItem>
//                     <SelectItem value="handyman">Handyman services</SelectItem>
//                     <SelectItem value="delivery">Delivery</SelectItem>
//                     <SelectItem value="other">Other</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <Input placeholder="Location" className="w-full" />
//                 <Button className="bg-blue-600 hover:bg-blue-700">
//                   <Search className="mr-2 h-4 w-4" />
//                   Find help
//                 </Button>
//               </div>
//             </motion.div>
//           </motion.div>

//           <motion.div
//             className="flex items-center justify-center lg:justify-end"
//             initial={{ opacity: 0, x: 100 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 }}
//           >
//             <div className="relative h-[400px] w-[400px] md:h-[500px] md:w-[500px]">
//               <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 rounded-l-3xl h-[300px] w-[50px]" />
//               <div className="relative z-10 overflow-hidden rounded-xl border bg-white shadow-xl">
//                 <Image
//                   src="/images/image1.jpeg"
//                   width={500}
//                   height={500}
//                   alt="TaskMaster illustration"
//                   className="object-cover"
//                 />
//                 <motion.div
//                   className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg"
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 1 }}
//                 >
//                   <div className="text-sm font-medium">Help me move</div>
//                   <div className="flex justify-between mt-1">
//                     <span className="text-xs text-gray-500">New York, NY</span>
//                     <span className="text-xs font-bold">$140</span>
//                   </div>
//                 </motion.div>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </section>
//   )
// }


"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { ArrowRight, Search } from "lucide-react"

export function HeroSection() {
  const [taskType, setTaskType] = useState("")

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

  const headingVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: 0.2,
      },
    },
  }

  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 md:py-24">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <motion.div
            className="flex flex-col justify-center space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-2" variants={itemVariants}>
              <motion.h1
                className="text-5xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none"
                variants={headingVariants}
                style={{
                  transform: "rotate(-5deg)",
                  color: "#0a2463",
                }}
              >
                GET MORE
                <br />
                DONE
              </motion.h1>
              <motion.p className="max-w-[600px] text-gray-700 md:text-xl" variants={itemVariants}>
                Post any task. Pick the best person. Get it done now.
              </motion.p>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-4 mt-6" variants={itemVariants}>
              <Link href="/post-task" className="w-full sm:w-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                  Post your task for free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
                >
                  Earn money as a Tasker
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div className="mt-8 p-4 bg-white rounded-lg shadow-md" variants={itemVariants}>
              <h3 className="text-lg font-medium mb-3">What do you need help with?</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moving">Help me move</SelectItem>
                    <SelectItem value="cleaning">House cleaning</SelectItem>
                    <SelectItem value="handyman">Handyman services</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Location" className="w-full" />
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Search className="mr-2 h-4 w-4" />
                  Find help
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex items-center justify-center lg:justify-end"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 }}
          >
            <div className="relative h-[400px] w-[400px] md:h-[500px] md:w-[500px]">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 rounded-l-3xl h-[300px] w-[50px]" />
              <div className="relative z-10 overflow-hidden rounded-xl border bg-white shadow-xl">
                <Image
                  src="/images/image1.jpeg"
                  width={500}
                  height={500}
                  alt="TaskMaster illustration"
                  className="object-cover"
                />
                <motion.div
                  className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <div className="text-sm font-medium">Help me move</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">New York, NY</span>
                    <span className="text-xs font-bold">$140</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}