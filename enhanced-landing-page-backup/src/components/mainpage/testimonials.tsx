// "use client"

// import { useState, useEffect } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { ChevronLeft, ChevronRight, Star } from "lucide-react"
// import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
// import { Button } from "../../components/ui/button"

// export function Testimonials() {
//   const testimonials = [
//     {
//       name: "Alex Johnson",
//       role: "Homeowner",
//       avatar: "/images/placeholder.svg?height=40&width=40",
//       content:
//         "TaskMaster made moving to my new apartment so much easier. I found reliable movers within minutes and at a great price!",
//       rating: 5,
//     },
//     {
//       name: "Sarah Williams",
//       role: "Busy Professional",
//       avatar: "/images/placeholder.svg?height=40&width=40",
//       content:
//         "As someone with a packed schedule, TaskMaster has been a lifesaver. I can outsource my errands and focus on what matters most.",
//       rating: 5,
//     },
//     {
//       name: "Michael Chen",
//       role: "Small Business Owner",
//       avatar: "/images/placeholder.svg?height=40&width=40",
//       content:
//         "I use TaskMaster for all my business delivery needs. The platform is reliable, and the Taskers are always professional.",
//       rating: 4,
//     },
//     {
//       name: "Emily Rodriguez",
//       role: "Tasker",
//       avatar: "/images/placeholder.svg?height=40&width=40",
//       content:
//         "Being a Tasker has given me the flexibility to earn extra income on my own schedule. The platform is easy to use and the support is great!",
//       rating: 5,
//     },
//   ]

//   const [current, setCurrent] = useState(0)
//   const [autoplay, setAutoplay] = useState(true)

//   useEffect(() => {
//     if (!autoplay) return

//     const interval = setInterval(() => {
//       setCurrent((prev) => (prev + 1) % testimonials.length)
//     }, 5000)

//     return () => clearInterval(interval)
//   }, [autoplay, testimonials.length])

//   const next = () => {
//     setAutoplay(false)
//     setCurrent((prev) => (prev + 1) % testimonials.length)
//   }

//   const previous = () => {
//     setAutoplay(false)
//     setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
//   }

//   return (
//     <section className="py-20 bg-white">
//       <div className="container px-4 md:px-6">
//         <motion.div
//           className="text-center mb-12"
//           initial={{ opacity: 0, y: -20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           viewport={{ once: true }}
//         >
//           <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">What our users say</h2>
//           <p className="mt-4 text-gray-500 md:text-xl max-w-3xl mx-auto">
//             Join thousands of satisfied customers and Taskers
//           </p>
//         </motion.div>

//         <div className="relative max-w-4xl mx-auto">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={current}
//               initial={{ opacity: 0, x: 100 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: -100 }}
//               transition={{ type: "spring", stiffness: 100, damping: 20 }}
//               className="bg-slate-50 p-8 rounded-2xl shadow-lg"
//             >
//               <div className="flex flex-col items-center text-center">
//                 <div className="flex mb-4">
//                   {[...Array(testimonials[current].rating)].map((_, i) => (
//                     <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
//                   ))}
//                 </div>
//                 <p className="text-xl mb-6 italic">"{testimonials[current].content}"</p>
//                 <Avatar className="h-16 w-16 mb-4">
//                   <AvatarImage
//                     src={testimonials[current].avatar || "/images/placeholder.svg"}
//                     alt={testimonials[current].name}
//                   />
//                   <AvatarFallback>{testimonials[current].name.charAt(0)}</AvatarFallback>
//                 </Avatar>
//                 <div>
//                   <h4 className="font-bold text-lg">{testimonials[current].name}</h4>
//                   <p className="text-gray-500">{testimonials[current].role}</p>
//                 </div>
//               </div>
//             </motion.div>
//           </AnimatePresence>

//           <div className="flex justify-center mt-8 gap-4">
//             <Button variant="outline" size="icon" onClick={previous} className="rounded-full">
//               <ChevronLeft className="h-5 w-5" />
//               <span className="sr-only">Previous</span>
//             </Button>
//             <Button variant="outline" size="icon" onClick={next} className="rounded-full">
//               <ChevronRight className="h-5 w-5" />
//               <span className="sr-only">Next</span>
//             </Button>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"

export function Testimonials() {
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Homeowner",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "TaskMaster made moving to my new apartment so much easier. I found reliable movers within minutes and at a great price!",
      rating: 5,
    },
    {
      name: "Sarah Williams",
      role: "Busy Professional",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "As someone with a packed schedule, TaskMaster has been a lifesaver. I can outsource my errands and focus on what matters most.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Small Business Owner",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "I use TaskMaster for all my business delivery needs. The platform is reliable, and the Taskers are always professional.",
      rating: 4,
    },
    {
      name: "Emily Rodriguez",
      role: "Tasker",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "Being a Tasker has given me the flexibility to earn extra income on my own schedule. The platform is easy to use and the support is great!",
      rating: 5,
    },
  ]

  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay, testimonials.length])

  const next = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }

  const previous = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 bg-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">What our users say</h2>
          <p className="mt-4 text-gray-500 md:text-xl max-w-3xl mx-auto">
            Join thousands of satisfied customers and Taskers
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="bg-slate-50 p-8 rounded-2xl shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex mb-4">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xl mb-6 italic">"{testimonials[current].content}"</p>
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarImage
                    src={testimonials[current].avatar || "/images/placeholder.svg"}
                    alt={testimonials[current].name}
                  />
                  <AvatarFallback>{testimonials[current].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-lg">{testimonials[current].name}</h4>
                  <p className="text-gray-500">{testimonials[current].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center mt-8 gap-4">
            <Button variant="outline" size="icon" onClick={previous} className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button variant="outline" size="icon" onClick={next} className="rounded-full">
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}