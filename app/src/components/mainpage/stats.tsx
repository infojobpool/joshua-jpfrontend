"use client"

import { motion } from "framer-motion"
import { Users, CheckCircle, Star, Heart, Palette, Wrench } from "lucide-react"
import Image from "next/image"

export function Stats() {
  const stats = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      value: "1M+",
      label: "Happy customers",
      bgColor: "from-blue-500 to-blue-600",
      imageSrc: "/images/image1.jpeg",
      description: "Trusted by millions"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-green-600" />,
      value: "2.5M+",
      label: "Tasks completed",
      bgColor: "from-green-500 to-green-600",
      imageSrc: "/images/image2.jpeg",
      description: "Successfully delivered"
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-600" />,
      value: "4M+",
      label: "User reviews",
      bgColor: "from-yellow-500 to-yellow-600",
      imageSrc: "/images/mobileapp.png",
      description: "Rated by community"
    },
  ]

  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-200 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose JobPool?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of people who trust JobPool for their everyday tasks
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.2,
                duration: 0.6,
              }}
              viewport={{ once: true }}
            >
              {/* Background image */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20 group-hover:opacity-30 transition-opacity">
                <Image
                  src={stat.imageSrc}
                  alt="Background"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Content */}
              <div className={`relative bg-gradient-to-br ${stat.bgColor} p-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2`}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    {stat.icon}
                  </div>
                  <motion.div
                    className="text-4xl font-bold mb-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-lg text-white/90 font-medium mb-2">{stat.label}</div>
                  <div className="text-sm text-white/70">{stat.description}</div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full"></div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Additional info */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">Live updates • 24/7 support</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
