"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Quote, Heart, Users, TrendingUp, Sparkles, CheckCircle } from "lucide-react"
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
    <section className="py-12 bg-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What People Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories from our community
          </p>
        </motion.div>

        {/* Simple Stats */}
        <motion.div
          className="flex justify-center gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">50K+</div>
            <div className="text-sm text-gray-600">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">4.9★</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">₹2M+</div>
            <div className="text-sm text-gray-600">Earned</div>
          </div>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-200 relative"
            >
              {/* Simple Quote Icon */}
              <div className="absolute top-6 left-6 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Quote className="h-4 w-4 text-blue-600" />
              </div>

              <div className="relative z-10">
                {/* Rating Stars */}
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400 mx-1" />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-lg text-gray-700 mb-6 italic text-center leading-relaxed">
                  "{testimonials[current].content}"
                </p>

                {/* Category Badge */}
                <div className="flex justify-center mb-6">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {testimonials[current].category}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={testimonials[current].avatar || "/images/placeholder.svg"}
                      alt={testimonials[current].name}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                      {testimonials[current].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">{testimonials[current].name}</h4>
                    <p className="text-sm text-gray-600">{testimonials[current].role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Simple Navigation Controls */}
          <div className="flex justify-center items-center mt-8 gap-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={previous} 
              className="rounded-full w-10 h-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Simple Dots Indicator */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === current 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={next} 
              className="rounded-full w-10 h-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Simple Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-blue-50 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of people who trust JobPool for their tasks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                Post Your Task
              </Button>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3">
                Become a Helper
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}