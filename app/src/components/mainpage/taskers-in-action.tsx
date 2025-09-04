"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const services = [
  {
    id: 1,
    title: "Furniture Assembly",
    price: "$49",
    image: "/images/furniture-assembly-realistic.svg",
    description: "Professional furniture assembly services"
  },
  {
    id: 2,
    title: "Mount Art or Shelves",
    price: "$65",
    image: "/images/mount-art.svg",
    description: "Expert mounting and installation"
  },
  {
    id: 3,
    title: "Mount a TV",
    price: "$69",
    image: "/images/tv-mounting-realistic.svg",
    description: "Safe and secure TV mounting"
  },
  {
    id: 4,
    title: "Help Moving",
    price: "$67",
    image: "/images/help-moving.svg",
    description: "Reliable moving assistance"
  },
  {
    id: 5,
    title: "Home & Apartment Cleaning",
    price: "$49",
    image: "/images/home-cleaning.svg",
    description: "Thorough cleaning services"
  },
  {
    id: 6,
    title: "Minor Plumbing Repairs",
    price: "$74",
    image: "/images/plumbing-repairs.svg",
    description: "Quick plumbing fixes"
  },
  {
    id: 7,
    title: "Electrical Help",
    price: "$69",
    image: "/images/electrical-help.svg",
    description: "Safe electrical services"
  },
  {
    id: 8,
    title: "Heavy Lifting",
    price: "$61",
    image: "/images/heavy-lifting.svg",
    description: "Professional heavy lifting"
  }
]

export function TaskersInAction() {
  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Common Tasks & Pricing
          </h2>
          <p className="text-gray-600 text-lg">
            See what people typically need help with and how much it costs
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1 
              }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              {/* Service Image */}
              <div className="relative w-full h-48 overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Service Content */}
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-blue-600 font-medium text-lg">
                  Projects starting at {service.price}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
