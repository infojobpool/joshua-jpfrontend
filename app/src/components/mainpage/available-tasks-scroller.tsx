"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MapPin, Loader2, Briefcase } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { prefetchBidsForTask } from "@/lib/taskNavCache"

interface Task {
  id: string
  title: string
  description: string
  budget: number
  location: string
  category_name: string
  postedAt: string
  job_images?: { urls?: string[] } | string[]
}

export function AvailableTasksScroller() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get("/get-all-jobs/")
        if (response.data?.status_code === 200 && response.data?.data?.jobs) {
          const mapped: Task[] = (response.data.data.jobs as any[]).map((job: any) => ({
            id: job.job_id,
            title: job.job_title || "Task",
            description: job.job_description || "",
            budget: Number(job.job_budget) || 0,
            location: job.job_location || "",
            category_name: job.job_category_name || job.job_category || "General",
            postedAt: job.created_at || "",
            job_images: job.job_images,
          }))
          setTasks(mapped)
        }
      } catch {
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const step = 296
    scrollRef.current.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" })
  }

  // Continuous auto-scroll
  useEffect(() => {
    if (!tasks.length || !scrollRef.current) return
    const el = scrollRef.current
    let rafId: number
    const tick = () => {
      el.scrollLeft += 1
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [tasks.length])

  const formatBudget = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
    return `₹${n}`
  }

  return (
    <section className="pt-8 pb-12 md:pt-10 md:pb-14 bg-white overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            We love a to-do
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            From odd jobs to serious renovations, the help you&apos;re looking for is on JobPool.
          </p>
        </motion.div>

        <div className="relative">
          {loading ? (
            <div className="flex gap-4 overflow-hidden pb-4 justify-center flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl bg-gray-100 animate-pulse"
                />
              ))}
              <div className="flex items-center justify-center w-full py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tasks available yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to post a task!</p>
              <Link
                href="/post-task"
                className="inline-block mt-4 text-blue-600 font-medium hover:underline"
              >
                Post a task
              </Link>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollSnapType: "x mandatory",
                }}
              >
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex-shrink-0 scroll-snap-start w-[280px]"
                    onMouseEnter={() => { try { prefetchBidsForTask(task.id); } catch {} }} onTouchStart={() => { try { prefetchBidsForTask(task.id); } catch {} }}
                  >
                    <motion.div
                      className="bg-white border border-gray-100 rounded-2xl w-[280px] h-[200px] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="p-4 flex flex-col h-full min-w-0">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">
                          {task.category_name}
                        </span>
                        <h3 className="task-title text-slate-900 mt-1 line-clamp-2 min-h-[2.8em] text-xl md:text-2xl leading-snug">
                          {task.title}
                        </h3>
                        {task.location && (
                          <p className="flex items-center gap-1.5 text-gray-500 text-sm mt-2 flex-shrink-0 min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{task.location}</span>
                          </p>
                        )}
                        <p className="text-blue-600 font-semibold mt-2 flex-shrink-0">
                          {formatBudget(task.budget)}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 z-10 hidden md:flex"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 z-10 hidden md:flex"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}
