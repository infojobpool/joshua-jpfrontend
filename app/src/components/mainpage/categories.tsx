// "use client"

// import React, { useEffect, useState } from "react"
// import { motion } from "framer-motion"
// import Link from "next/link"
// import { Loader2 } from "lucide-react" // Added missing import
// import axiosInstance from '../../lib/axiosInstance'
// import { toast } from "sonner"

// interface Category {
//   category_id: string
//   category_name: string
//   status: boolean
//   created_at: string
//   // Optional properties for potential future use
//   icon?: React.ReactNode
//   tasks?: number
// }

// export function Categories() {
//   const [categories, setCategories] = useState<Category[]>([])
//   const [isLoading, setIsLoading] = useState(false)

//   const fetchCategories = async () => {
//     try {
//       setIsLoading(true)
//       const response = await axiosInstance.get("get-all-categories/")
//       if (response.data.status_code === 200) {
//         setCategories(response.data.data)
//       } else {
//         toast.error(response.data.message || "Failed to fetch categories")
//       }
//     } catch (error) {
//       toast.error(error instanceof Error ? error.message : "An error occurred while fetching categories")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchCategories()
//   }, [])

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
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

//   return (
//     <>
//       {isLoading ? (
//         <div className="flex justify-center items-center py-12">
//           <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//           <span className="ml-2 text-gray-500">Loading categories...</span>
//         </div>
//       ) : (
//         <section id="categories" className="py-16 bg-slate-50">
//           <div className="container px-4 md:px-6">
//             <motion.div
//               className="text-center mb-12"
//               initial={{ opacity: 0, y: -20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5 }}
//               viewport={{ once: true }}
//             >
//               <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
//                 Browse by category
//               </h2>
//               <p className="mt-4 text-gray-500 md:text-xl">Find the perfect Tasker for your needs</p>
//             </motion.div>

//             <motion.div
//               className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
//               variants={containerVariants}
//               initial="hidden"
//               whileInView="visible"
//               viewport={{ once: true }}
//             >
//               {categories.map((category) => (
//                 <motion.div
//                   key={category.category_id} // Use unique ID instead of index
//                   variants={itemVariants}
//                   whileHover={{
//                     scale: 1.05,
//                     boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                   }}
//                   className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                 >
//                   <Link
//                     href={`/categories/${category.category_name.toLowerCase().replace(/\s+/g, "-")}`}
//                     aria-label={`View ${category.category_name} category`} // Added for accessibility
//                   >
//                     <div className="flex flex-col items-center text-center">
//                       {category.icon && (
//                         <div className="p-3 bg-blue-50 rounded-full mb-4">{category.icon}</div>
//                       )}
//                       <h3 className="font-medium text-lg mb-1">{category.category_name}</h3>
//                       {category.tasks && (
//                         <p className="text-sm text-gray-500">{category.tasks} tasks</p>
//                       )}
//                     </div>
//                   </Link>
//                 </motion.div>
//               ))}
//             </motion.div>
//           </div>
//         </section>
//       )}
//     </>
//   )
// }

"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import axiosInstance from '../../lib/axiosInstance'
import { toast } from "sonner"

interface Category {
  category_id: string
  category_name: string
  status: boolean
  created_at: string
  icon?: React.ReactNode
  tasks?: number
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get("get-all-categories/")
      if (response.data.status_code === 200) {
        setCategories(response.data.data)
      } else {
        toast.error(response.data.message || "Failed to fetch categories")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while fetching categories")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Loading categories...</span>
        </div>
      ) : (
        <section id="categories" className="py-12 bg-slate-50">
          <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Browse by category
              </h2>
              <p className="mt-4 text-gray-500 md:text-xl">Find the perfect Tasker for your needs</p>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {categories.map((category) => (
                <motion.div
                  key={category.category_id}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                  className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
                >
                  {/* <Link
                    href={`/categories/${category.category_name.toLowerCase().replace(/\s+/g, "-")}`}
                    aria-label={`View ${category.category_name} category`}
                  > */}
                    <div className="flex flex-col items-center text-center">
                      {category.icon && (
                        <div className="p-3 bg-blue-50 rounded-full mb-4">{category.icon}</div>
                      )}
                      <h3 className="font-medium text-lg mb-1">{category.category_name}</h3>
                      {category.tasks && (
                        <p className="text-sm text-gray-500">{category.tasks} tasks</p>
                      )}
                    </div>
                  {/* </Link> */}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </>
  )
}