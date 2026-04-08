"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"
import { usePublicTestimonials } from "@/hooks/usePublicTestimonials"

const PLACEHOLDER_AVATAR = "/images/placeholder.svg"

export function Testimonials() {
  const { items: testimonials } = usePublicTestimonials()

  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    setCurrent((c) => (testimonials.length === 0 ? 0 : Math.min(c, testimonials.length - 1)))
  }, [testimonials.length])

  useEffect(() => {
    if (!autoplay || testimonials.length === 0) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 4000)

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

  if (testimonials.length === 0) {
    return null
  }

  const t = testimonials[current]

  return (
    <section className="py-12 bg-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
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

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={t.id + String(current)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-200 relative"
            >
              <div className="absolute top-6 left-6 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Quote className="h-4 w-4 text-blue-600" />
              </div>

              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400 mx-1" />
                  ))}
                </div>

                <p className="text-lg text-gray-700 mb-6 italic text-center leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>

                {t.category ? (
                  <div className="flex justify-center mb-6">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      {t.category}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center justify-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={t.avatarUrl || PLACEHOLDER_AVATAR}
                      alt={t.name}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                      {t.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">{t.name}</h4>
                    <p className="text-sm text-gray-600">{t.role || "JobPool customer"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center items-center mt-8 gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={previous}
              disabled={testimonials.length <= 1}
              className="rounded-full w-10 h-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === current ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Show testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={testimonials.length <= 1}
              className="rounded-full w-10 h-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
