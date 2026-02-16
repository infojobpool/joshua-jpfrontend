"use client";

import React from "react";
import Image from "next/image";
import { Shield, Clock, DollarSign, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Your money is protected until the work is done to your satisfaction.",
  },
  {
    icon: Clock,
    title: "Quick & Easy",
    description: "Post a task in minutes and get it done by local helpers.",
  },
  {
    icon: DollarSign,
    title: "Fair Pricing",
    description: "Set your budget and get offers from helpers in your price range.",
  },
  {
    icon: Users,
    title: "Trusted Helpers",
    description: "All helpers are verified and rated by previous customers.",
  },
];

export function MobileWhyChoose() {
  return (
    <section className="md:hidden px-4 py-8 bg-slate-50">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Why Choose JobPool?
        </h2>
        <p className="mt-2 text-gray-500 text-sm">
          Safe, reliable, and easy to use - everything you need to get tasks done.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="p-2 bg-blue-50 rounded-full inline-block mb-3">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="relative mt-6 rounded-2xl overflow-hidden shadow-lg w-full min-h-[240px] h-64 bg-gray-200">
          <Image
            src="/images/image2.jpeg"
            alt="Join our community"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-center">
            <div className="p-5 text-white w-full text-center">
              <h3 className="text-lg font-bold">Join our community</h3>
              <p className="text-sm text-white/90 mt-1">
                Connect with thousands of Taskers and customers in your area
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MobileWhyChoose;
