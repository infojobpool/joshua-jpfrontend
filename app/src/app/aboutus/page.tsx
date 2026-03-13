"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function AboutUs() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
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

  const values = [
    { title: "Opportunity", desc: "Opening doors for people to earn and grow" },
    { title: "Trust", desc: "Creating a safe and reliable marketplace" },
    { title: "Flexibility", desc: "Work anytime, anywhere" },
    { title: "Empowerment", desc: "Giving people control over their skills and income" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
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
            <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              JobPool is not just a platform — it is a movement to redefine how people work, earn, and create opportunities.
            </p>
            <p className="mt-4 text-lg font-semibold text-blue-600">
              Built and operated by Klughire Private Limited
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <motion.div
            className="space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                JobPool was created with a simple yet powerful mission: to connect skills with opportunities and make earning accessible to everyone.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Bridging the Gap</h2>
              <p className="text-slate-600 leading-relaxed">
                Across the world, millions of people have skills, time, and the willingness to work, yet opportunities often remain out of reach. At the same time, individuals and businesses constantly need help to complete tasks. JobPool bridges this gap by creating a trusted digital marketplace where people who need work done can instantly connect with people ready to do it.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">How It Works</h2>
              <p className="text-slate-600 leading-relaxed">
                Through JobPool, anyone can post a task — from everyday help like home services, tutoring, and deliveries to specialized professional work. Skilled individuals can browse tasks, submit bids, and earn income by doing work that fits their schedule and expertise.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Two Key Participants</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our platform empowers two key participants:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0 text-sm">1</span>
                  <div>
                    <strong className="text-slate-900">Taskmasters</strong>
                    <span className="text-slate-600"> — People or businesses who need tasks completed.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0 text-sm">2</span>
                  <div>
                    <strong className="text-slate-900">Taskers</strong>
                    <span className="text-slate-600"> — Individuals who bring skills, effort, and dedication to get the job done.</span>
                  </div>
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                By bringing these two together, JobPool creates a dynamic ecosystem where skills are valued, effort is rewarded, and opportunities are accessible to everyone.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Our Vision</h2>
              <p className="text-slate-600 leading-relaxed">
                Our vision goes far beyond just tasks. We believe the future of work is flexible, decentralized, and skill-driven. JobPool is building an ecosystem where people are not limited by traditional employment structures. Instead, they can earn on their own terms, monetize their abilities, and build independent income streams.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">What We Stand For</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                At its core, JobPool stands for:
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {values.map((v, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-white border border-slate-200">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <strong className="text-slate-900">{v.title}</strong>
                      <span className="text-slate-600"> — {v.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-xl bg-slate-800 text-white p-8 space-y-4">
              <h2 className="text-xl font-semibold">Our Mission</h2>
              <p className="text-slate-200 leading-relaxed">
                To build one of the most trusted and accessible task marketplaces where skills meet opportunities and work becomes limitless.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center space-y-6 pt-6">
              <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
                JobPool is not just about getting tasks done. It is about unlocking human potential and creating a future where anyone with a skill can find an opportunity.
              </p>
              <Link href="/post-task">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-700">
          © 2023 Klughire Pvt Limited. All rights reserved.
        </p>
        <p className="mt-2 text-sm font-medium text-blue-600">
          A product by Klughire®
        </p>
        <p className="mt-3 text-xs text-slate-500">
          8-3-169/60/438, Indira Nagar Colony Road, Yousufguda, Hyderabad, Telangana, 500045, India
        </p>
      </footer>
    </div>
  );
}
