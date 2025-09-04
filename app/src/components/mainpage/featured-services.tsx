"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Palette, Wrench, Users, Star, ArrowRight, Car, Home, Camera, BookOpen, Utensils, Truck } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function FeaturedServices() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const services = [
    {
      id: 1,
      title: "Creative Professionals",
      description: "Artists, designers, and craftspeople bringing your creative vision to life",
      image: "/images/mobileapp.png",
      category: "Creative",
      icon: <Palette className="h-5 w-5" />,
      stats: {
        taskers: "500+",
        rating: "4.9",
        reviews: "1,200+"
      },
      features: ["Custom artwork", "Design services", "Craft projects", "Photography"]
    },
    {
      id: 2,
      title: "Caregiving Services",
      description: "Compassionate caregivers providing support and companionship",
      image: "/images/image1.jpeg",
      category: "Care",
      icon: <Heart className="h-5 w-5" />,
      stats: {
        taskers: "300+",
        rating: "4.8",
        reviews: "800+"
      },
      features: ["Elderly care", "Companionship", "Assistance", "Support"]
    },
    {
      id: 3,
      title: "Handyman Services",
      description: "Skilled professionals for repairs, installations, and maintenance",
      image: "/images/image2.jpeg",
      category: "Home",
      icon: <Wrench className="h-5 w-5" />,
      stats: {
        taskers: "800+",
        rating: "4.9",
        reviews: "2,100+"
      },
      features: ["Repairs", "Installations", "Assembly", "Maintenance"]
    },
    {
      id: 4,
      title: "Moving & Delivery",
      description: "Reliable movers and delivery professionals for all your transport needs",
      image: "/images/image1.jpeg",
      category: "Transport",
      icon: <Truck className="h-5 w-5" />,
      stats: {
        taskers: "450+",
        rating: "4.7",
        reviews: "1,500+"
      },
      features: ["Home moving", "Furniture delivery", "Package delivery", "Storage"]
    },
    {
      id: 5,
      title: "House Cleaning",
      description: "Professional cleaning services for homes and offices",
      image: "/images/image2.jpeg",
      category: "Cleaning",
      icon: <Home className="h-5 w-5" />,
      stats: {
        taskers: "600+",
        rating: "4.8",
        reviews: "1,800+"
      },
      features: ["Deep cleaning", "Regular cleaning", "Post-construction", "Eco-friendly"]
    },
    {
      id: 6,
      title: "Photography & Events",
      description: "Capture your special moments with professional photographers",
      image: "/images/mobileapp.png",
      category: "Events",
      icon: <Camera className="h-5 w-5" />,
      stats: {
        taskers: "250+",
        rating: "4.9",
        reviews: "900+"
      },
      features: ["Wedding photos", "Event coverage", "Portrait sessions", "Commercial"]
    },
    {
      id: 7,
      title: "Tutoring & Education",
      description: "Expert tutors and educators for all subjects and age groups",
      image: "/images/image1.jpeg",
      category: "Education",
      icon: <BookOpen className="h-5 w-5" />,
      stats: {
        taskers: "400+",
        rating: "4.8",
        reviews: "1,100+"
      },
      features: ["Academic subjects", "Test preparation", "Language learning", "Music lessons"]
    },
    {
      id: 8,
      title: "Catering & Food",
      description: "Delicious catering services for events and special occasions",
      image: "/images/image2.jpeg",
      category: "Food",
      icon: <Utensils className="h-5 w-5" />,
      stats: {
        taskers: "350+",
        rating: "4.7",
        reviews: "950+"
      },
      features: ["Event catering", "Meal prep", "Special diets", "Food delivery"]
    }
  ]

  // Auto-scroll effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length)
    }, 2500) // Change every 2.5 seconds for faster scrolling

    return () => clearInterval(timer)
  }, [services.length])

  // Scroll to current card
  useEffect(() => {
    if (scrollContainerRef.current) {
      const cardWidth = 320 // Approximate card width + gap
      scrollContainerRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth'
      })
    }
  }, [currentIndex])

  return (
    <section className="py-12 bg-white overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Popular Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find help for the most common tasks people need
          </p>
        </motion.div>

        {/* Horizontal Scrolling Cards Container - Centered */}
        <div className="relative max-w-7xl mx-auto">
          {/* Scroll Container - Centered with padding */}
          <div className="flex justify-center">
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 px-4"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory'
              }}
            >
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 scroll-snap-start"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800 flex items-center gap-2">
                      {service.icon}
                      {service.category}
                    </div>

                    {/* Stats overlay */}
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{service.stats.rating}</span>
                        <span className="text-gray-600">({service.stats.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
                    
                    {/* Features */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {service.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{service.stats.taskers}</div>
                        <div className="text-xs text-gray-500">Taskers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{service.stats.rating}★</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{service.stats.reviews}</div>
                        <div className="text-xs text-gray-500">Reviews</div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link href={`/browse?category=${service.category.toLowerCase()}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Browse {service.category} Services
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {services.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + services.length) % services.length)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors border border-gray-200 z-10"
          >
            <ArrowRight className="h-5 w-5 text-gray-700 rotate-180" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % services.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors border border-gray-200 z-10"
          >
            <ArrowRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Link href="/browse">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              Explore All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
