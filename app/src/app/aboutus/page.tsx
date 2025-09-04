"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../../components/ui/button";

export default function AboutUs() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-900">
              About Us – JobPool
            </h1>
            <p className="mt-4 text-xl text-slate-500 max-w-3xl mx-auto">
              JobPool is a smart, hyperlocal job marketplace designed to connect job seekers and job providers across a wide range of everyday tasks and services.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            className="grid gap-12 lg:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">🎯 Our Mission</h2>
                <p className="text-slate-500">
                  To empower communities by creating flexible job opportunities and making essential services more accessible — all within a trusted digital ecosystem.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">🛠️ What We Offer</h2>
                <ul className="space-y-3 text-slate-500">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>👩‍🔧 For Job Seekers:</strong> Discover local tasks, bid on jobs, and earn income on your schedule. No middlemen. No long-term commitments.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>🏠 For Job Posters:</strong> Post any task — big or small — and choose from verified, nearby service providers who bid to complete it.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>💬 Built-in Chat & Bidding:</strong> Transparent negotiation and real-time communication between users.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>🔒 Secure & Transparent:</strong> Review profiles, track progress, and make informed choices.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">🌐 Who We Serve</h2>
                <ul className="space-y-3 text-slate-500">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Busy professionals needing help with home tasks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Freelancers and skilled individuals looking for daily work</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Households seeking domestic help on-demand</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Local businesses needing short-term assistance</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">🚀 Why JobPool?</h2>
                <ul className="space-y-3 text-slate-500">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Instant matching</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Verified users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Location-based service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Zero platform fee for basic jobs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Community-driven trust and reviews</span>
                  </li>
                </ul>
              </div>

              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">📲 Join JobPool Today</h2>
                <p className="text-slate-500 mb-6">
                  Whether you’re looking to earn or hire, JobPool is your one-stop platform for reliable, local, and daily job connections. Your next opportunity is just a tap away.
                </p>
                <div className="flex flex-col items-center lg:items-start gap-4">
                  <Link href="/post-task">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg w-full sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
    
  );
}