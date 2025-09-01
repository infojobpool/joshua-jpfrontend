// "use client"

// import { motion } from "framer-motion"
// import { Users, CheckCircle, Star } from "lucide-react"

// export function Stats() {
//   const stats = [
//     {
//       icon: <Users className="h-6 w-6 text-blue-600" />,
//       value: "1M+",
//       label: "customers",
//     },
//     {
//       icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
//       value: "2.5M+",
//       label: "tasks done",
//     },
//     {
//       icon: <Star className="h-6 w-6 text-blue-600" />,
//       value: "4M+",
//       label: "user reviews",
//     },
//   ]

//   return (
//     <section className="py-12 bg-white">
//       <div className="container px-4 md:px-6">
//         <div className="flex flex-wrap justify-center gap-8 md:gap-12">
//           {stats.map((stat, index) => (
//             <motion.div
//               key={index}
//               className="flex items-center gap-4"
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{
//                 delay: index * 0.1,
//                 duration: 0.5,
//               }}
//               viewport={{ once: true }}
//             >
//               {stat.icon}
//               <div>
//                 <motion.div
//                   className="text-2xl font-bold"
//                   initial={{ opacity: 0 }}
//                   whileInView={{ opacity: 1 }}
//                   transition={{ delay: 0.3 + index * 0.1 }}
//                   viewport={{ once: true }}
//                 >
//                   {stat.value}
//                 </motion.div>
//                 <div className="text-sm text-gray-500">{stat.label}</div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

"use client"

import { motion } from "framer-motion"
import { Users, CheckCircle, Star } from "lucide-react"

export function Stats() {
  const stats = [
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      value: "1M+",
      label: "customers",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
      value: "2.5M+",
      label: "tasks done",
    },
    {
      icon: <Star className="h-6 w-6 text-blue-600" />,
      value: "4M+",
      label: "user reviews",
    },
  ]

  return (
    <section className="py-12 bg-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
              }}
              viewport={{ once: true }}
            >
              {stat.icon}
              <div>
                <motion.div
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
