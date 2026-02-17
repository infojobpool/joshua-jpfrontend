"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Palette, Wrench, Users, Star, ArrowRight, ArrowLeft, Car, Home, Camera, BookOpen, Utensils, Truck } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function FeaturedServices() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)

  const services = [
    {
      id: 1,
      title: "Creative Professionals",
      description: "Artists, designers, and craftspeople bringing your creative vision to life",
      image: "/images/creative%20professionals.webp",
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
      image: "/images/caretaking%20services.jpg",
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
      image: "/images/handyman%20services.jpg",
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
      image: "/images/moving%20and%20delievery.jpg",
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
      image: "/images/house%20cleaning.jpeg",
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
      image: "/images/photography%20and%20events.jpg",
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
      image: "/images/catering%20and%20events.jpg",
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

  // Scroll to current card when the user changes it.
  // Skip the initial render so we don't auto-scroll the whole page down on first load.
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      return
    }

    const container = scrollContainerRef.current
    if (!container) return
    const card = container.children[currentIndex] as HTMLElement
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    }
  }, [currentIndex])

  return (
    <section className="py-12 bg-gray-50 overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Popular Services
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Find help for the most common tasks people need
          </p>
        </motion.div>

        {/* Horizontal Scrolling Cards Container - Centered */}
        <div className="relative max-w-7xl mx-auto">
          {/* Scroll Container - Centered with padding */}
          <div className="flex justify-center">
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 pl-12 pr-12 md:pl-14 md:pr-14"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory'
              }}
            >
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  className="flex-shrink-0 w-56 sm:w-60 md:w-64 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 scroll-snap-start"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  {/* Image */}
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Category badge */}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-gray-800 flex items-center gap-1">
                      {service.icon}
                      {service.category}
                    </div>

                    {/* Stats overlay */}
                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="font-semibold">{service.stats.rating}</span>
                        <span className="text-gray-600">({service.stats.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{service.title}</h3>
                    <p className="text-gray-600 mb-3 text-xs line-clamp-2">{service.description}</p>
                    
                    {/* Features */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-3 text-center">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{service.stats.taskers}</div>
                        <div className="text-[10px] text-gray-500">Taskers</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-green-600">{service.stats.rating}★</div>
                        <div className="text-[10px] text-gray-500">Rating</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{service.stats.reviews}</div>
                        <div className="text-[10px] text-gray-500">Reviews</div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link href={`/browse?category=${service.category.toLowerCase()}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 h-auto">
                        Browse {service.category}
                        <ArrowRight className="ml-1 h-3 w-3" />
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

          {/* Navigation Arrows - circular white with black arrow (AirTasker style) */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + services.length) % services.length)}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 z-10 text-gray-900"
            aria-label="Previous service"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % services.length)}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 z-10 text-gray-900"
            aria-label="Next service"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-8"
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
