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
    <section className="border-t border-slate-100/80 bg-gradient-to-b from-slate-50/90 via-white to-white py-8 md:py-11">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="mx-auto mb-6 max-w-2xl text-center md:mb-7"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            What People Say
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Real stories from our community
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={t.id + String(current)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04] sm:p-8"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
                aria-hidden
              />
              <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:right-6 sm:top-6">
                <Quote className="h-4 w-4" aria-hidden />
              </div>

              <div className="relative z-10 pt-1">
                <div className="mb-3 flex justify-center gap-0.5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="mx-0.5 h-4 w-4 fill-amber-400 text-amber-400 sm:h-[1.05rem] sm:w-[1.05rem]" />
                  ))}
                </div>

                <blockquote className="mb-6 text-center text-[0.9375rem] font-medium leading-relaxed text-slate-700 sm:text-lg">
                  <span className="text-slate-400">&ldquo;</span>
                  {t.text}
                  <span className="text-slate-400">&rdquo;</span>
                </blockquote>

                {t.category ? (
                  <div className="mb-6 flex justify-center">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100/80">
                      {t.category}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center justify-center gap-3 border-t border-slate-100 pt-5 sm:gap-4">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow-md sm:h-12 sm:w-12">
                    <AvatarImage src={t.avatarUrl || PLACEHOLDER_AVATAR} alt={t.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-800">
                      {t.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 text-left">
                    <h4 className="truncate font-semibold text-slate-900">{t.name}</h4>
                    <p className="truncate text-xs text-slate-600 sm:text-sm">{t.role || "JobPool customer"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-5 sm:mt-7 sm:gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={previous}
              disabled={testimonials.length <= 1}
              className="h-10 w-10 rounded-full border-slate-200 shadow-sm hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setAutoplay(false)
                    setCurrent(index)
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === current ? "w-6 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400"
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
              className="h-10 w-10 rounded-full border-slate-200 shadow-sm hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
