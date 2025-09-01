"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Quote, Heart, Users, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"

export function Testimonials() {
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Homeowner & Customer",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "JobPool has been incredible! I found a reliable handyman who fixed my kitchen sink in just 2 hours. The quality of work was outstanding and the price was fair. Highly recommend!",
      rating: 5,
      category: "Home Services",
      location: "Mumbai, Maharashtra"
    },
    {
      name: "Rajesh Kumar",
      role: "Small Business Owner",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "As a restaurant owner, I use JobPool for all my delivery needs. The Taskers are punctual, professional, and always handle our food with care. It's transformed our delivery operations!",
      rating: 5,
      category: "Food Delivery",
      location: "Delhi, NCR"
    },
    {
      name: "Anjali Patel",
      role: "Busy Professional",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "JobPool is a lifesaver! I can outsource household tasks and focus on my career. The caregivers I found for my elderly parents are compassionate and reliable. Thank you JobPool!",
      rating: 5,
      category: "Caregiving",
      location: "Bangalore, Karnataka"
    },
    {
      name: "Vikram Singh",
      role: "Tasker & Service Provider",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "Being a Tasker on JobPool has given me financial freedom! I can work on my own schedule, choose my clients, and earn a good income. The platform is user-friendly and support is excellent.",
      rating: 5,
      category: "Professional Tasker",
      location: "Pune, Maharashtra"
    },
    {
      name: "Meera Reddy",
      role: "Event Organizer",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "JobPool helped me find amazing photographers and caterers for my daughter's wedding. The quality of services exceeded my expectations. The platform made event planning so much easier!",
      rating: 5,
      category: "Events & Photography",
      location: "Hyderabad, Telangana"
    },
    {
      name: "Arjun Mehta",
      role: "Student & Part-time Tasker",
      avatar: "/images/placeholder.svg?height=40&width=40",
      content:
        "JobPool is perfect for students like me! I can earn money by helping others with tasks while managing my studies. The flexible hours and fair pay make it ideal for part-time work.",
      rating: 5,
      category: "Student Services",
      location: "Chennai, Tamil Nadu"
    }
  ]

  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 4000) // Change every 4 seconds

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
    <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4" />
            Trusted by 10,000+ Users
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            What Our Community Says
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real stories from customers and Taskers who have transformed their lives through JobPool
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-blue-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
            <div className="text-gray-600 font-medium">Happy Customers</div>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">₹2M+</div>
            <div className="text-gray-600 font-medium">Earned by Taskers</div>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-purple-100">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">4.9★</div>
            <div className="text-gray-600 font-medium">Average Rating</div>
          </div>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 20,
                duration: 0.6 
              }}
              className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full translate-y-12 -translate-x-12 opacity-60"></div>
              
              {/* Quote Icon */}
              <div className="absolute top-8 left-8 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center opacity-80">
                <Quote className="h-8 w-8 text-blue-600" />
              </div>

              <div className="relative z-10">
                {/* Rating Stars */}
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 mx-1" />
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial Content */}
                <motion.p 
                  className="text-2xl text-gray-800 mb-8 italic text-center leading-relaxed max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  "{testimonials[current].content}"
                </motion.p>

                {/* Category Badge */}
                <motion.div 
                  className="flex justify-center mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                    {testimonials[current].category}
                  </span>
                </motion.div>

                {/* User Info */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Avatar className="h-20 w-20 mb-4 border-4 border-blue-100">
                      <AvatarImage
                        src={testimonials[current].avatar || "/images/placeholder.svg"}
                        alt={testimonials[current].name}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                        {testimonials[current].name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <h4 className="font-bold text-xl text-gray-900 mb-1">{testimonials[current].name}</h4>
                    <p className="text-blue-600 font-medium mb-1">{testimonials[current].role}</p>
                    <p className="text-gray-500 text-sm">{testimonials[current].location}</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center mt-12 gap-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={previous} 
              className="rounded-full w-14 h-14 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
            >
              <ChevronLeft className="h-6 w-6 text-blue-600" />
            </Button>
            
            {/* Dots Indicator */}
            <div className="flex gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === current 
                      ? 'bg-blue-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={next} 
              className="rounded-full w-14 h-14 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
            >
              <ChevronRight className="h-6 w-6 text-blue-600" />
            </Button>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join Our Community?
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Whether you need help with tasks or want to earn money as a Tasker, JobPool is here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl">
                Post Your Task
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl">
                Become a Tasker
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}