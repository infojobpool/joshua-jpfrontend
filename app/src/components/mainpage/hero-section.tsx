"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { ArrowRight, Search, Wrench, Users, Star, Heart, Palette } from "lucide-react"

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
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 md:py-10">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <motion.div
            className="flex flex-col justify-center space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-1" variants={itemVariants}>
              <motion.h1
                className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl xl:text-6xl/none"
                variants={headingVariants}
                style={{
                  color: "#0a2463",
                }}
              >
                Get Any Task Done
              </motion.h1>
              <p className="max-w-[600px] text-gray-700 text-base sm:text-lg md:text-xl mb-1">
                Post your task, get offers from local helpers, and get it done quickly and safely.
              </p>
              <p className="max-w-[600px] text-gray-600 text-sm sm:text-base md:text-lg">
                From home repairs to pet care, find trusted help or earn money by helping others.
              </p>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4" variants={itemVariants}>
              <Link href="/post-task" className="w-full sm:w-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg">
                  Post a Task - It's Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg"
                >
                  Earn Money Helping Others
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div className="mt-6 p-3 sm:p-4 bg-white rounded-lg shadow-md" variants={itemVariants}>
              <h3 className="text-base sm:text-lg font-medium mb-3">What do you need help with?</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="w-full h-10 sm:h-11">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moving">Help me move</SelectItem>
                    <SelectItem value="cleaning">House cleaning</SelectItem>
                    <SelectItem value="handyman">Handyman services</SelectItem>
                    <SelectItem value="caregiving">Caregiving</SelectItem>
                    <SelectItem value="creative">Creative services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Location" className="w-full h-10 sm:h-11" />
                <Button className="bg-blue-600 hover:bg-blue-700 h-10 sm:h-11 px-4 sm:px-6">
                  <Search className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Find help</span>
                  <span className="sm:hidden">Find</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex items-center justify-center lg:justify-end order-first lg:order-last"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 }}
          >
            <div className="relative w-full max-w-md lg:max-w-none">
              {/* Main Image - Caregiving Scene */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] lg:w-[500px] lg:h-[600px] xl:w-[550px] xl:h-[650px] relative overflow-hidden">
                  {/* Main caregiving image */}
                  <Image
                    src="/images/caregiving-hero.jpg"
                    alt="JobPool helper in blue t-shirt offering water to elderly woman with walker - compassionate caregiving services"
                    fill
                    className="object-cover"
                  />
                  
                  {/* Overlay with text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Compassionate Care</h3>
                        <p className="text-sm sm:text-base lg:text-lg text-blue-100">Professional caregivers ready to help</p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold">300+</div>
                        <div className="text-xs sm:text-sm text-blue-100">Caregivers</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold">4.9★</div>
                        <div className="text-xs sm:text-sm text-blue-100">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating stats cards - only top-left */}
                <motion.div
                  className="absolute -top-3 -left-3 sm:-top-6 sm:-left-6 bg-white p-3 sm:p-5 rounded-xl shadow-xl border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-xl font-bold text-gray-800">2,500+</div>
                      <p className="text-xs sm:text-sm text-gray-500">Happy customers</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Background decorative elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] sm:w-[500px] sm:h-[600px] lg:w-[600px] lg:h-[700px] bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl"></div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </section>
  )
}