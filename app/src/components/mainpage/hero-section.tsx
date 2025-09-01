"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { ArrowRight, Search, Wrench, Users, Star } from "lucide-react"

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
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 md:py-24">
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
              <p className="max-w-[600px] text-gray-700 md:text-xl">
                Post any task. Pick the best person. Get it done now.
              </p>
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
            <div className="relative">
              {/* Main Tasker Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <div className="w-[400px] h-[500px] md:w-[450px] md:h-[550px] bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center relative overflow-hidden">
                  {/* Tasker working image placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 opacity-80"></div>
                  
                  {/* Tasker silhouette/icon */}
                  <div className="relative z-10 text-center">
                    <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Wrench className="h-20 w-20 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Professional Tasker</h3>
                    <p className="text-gray-700 text-lg mb-4">Ready to help with your tasks</p>
                    
                    {/* Tasker stats */}
                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">500+</div>
                        <div className="text-xs text-gray-600">Tasks Completed</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">4.9★</div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-yellow-400 rounded-full opacity-20"></div>
                  <div className="absolute bottom-8 left-6 w-12 h-12 bg-green-400 rounded-full opacity-20"></div>
                </div>
                
                {/* Floating stats cards */}
                <motion.div
                  className="absolute -top-4 -left-4 bg-white p-4 rounded-xl shadow-xl border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">2,500+</div>
                      <p className="text-xs text-gray-500">Happy customers</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-xl border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">4.9</div>
                      <p className="text-xs text-gray-500">Average rating</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Background decorative elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl"></div>
            </div>
          </motion.div>
        </div>
        
        {/* Tasker Working Section */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              See Our Taskers in Action
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Professional, reliable, and ready to tackle any task you need
            </p>
            
            {/* Tasker working grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tasker 1 - Handyman */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Handyman Services</h3>
                <p className="text-gray-600 text-sm mb-3">Furniture assembly, repairs, installations</p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span>4.9 (120 reviews)</span>
                </div>
              </div>
              
              {/* Tasker 2 - Moving */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">📦</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Moving & Delivery</h3>
                <p className="text-gray-600 text-sm mb-3">Heavy lifting, packing, transportation</p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span>4.8 (95 reviews)</span>
                </div>
              </div>
              
              {/* Tasker 3 - Cleaning */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">🧹</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">House Cleaning</h3>
                <p className="text-gray-600 text-sm mb-3">Deep cleaning, organizing, maintenance</p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span>4.9 (88 reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}