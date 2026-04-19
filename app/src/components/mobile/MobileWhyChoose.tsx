"use client";

import React from "react";
import Image from "next/image";
import { Shield, Clock, IndianRupee, Users } from "lucide-react";

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
    icon: IndianRupee,
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
    <section className="md:hidden bg-slate-50 px-4 py-4">
      <div className="mx-auto max-w-lg">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">Why JobPool?</h2>
        <p className="mt-0.5 text-xs text-gray-500">Safe payments, fair pricing, verified helpers.</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm"
              >
                <div className="inline-flex rounded-full bg-blue-50 p-1.5">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="mt-1.5 text-xs font-bold leading-tight text-gray-900">{feature.title}</h3>
                <p className="mt-0.5 text-[10px] leading-snug text-gray-500 line-clamp-3">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-200 shadow-md">
          <Image
            src="/images/image2.jpeg"
            alt="Join our community"
            fill
            className="object-cover object-[50%_40%]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/65 via-black/15 to-transparent">
            <div className="w-full px-3 py-2.5 text-center text-white">
              <h3 className="text-sm font-bold">Join our community</h3>
              <p className="mt-0.5 text-[10px] text-white/90 line-clamp-2">
                Taskers and customers near you
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MobileWhyChoose;
