"use client";

import React from "react";
import Link from "next/link";
import { Smartphone, Clock, IndianRupee, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CARDS = [
  {
    icon: Smartphone,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    title: "Download the JobPool App",
    description:
      "Download the JobPool App and get the tasks you need completed with just a tap of the button. You can also browse available tasks and earn money wherever you go!",
    cta: "Earn up to ₹50,000 per month completing tasks",
  },
  {
    icon: Clock,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    title: "All on your terms",
    description:
      "Saw a job that fits your skills and timeframe? Go for it. JobPool's flexible to your schedule.",
    cta: "Work when you want, where you want",
  },
  {
    icon: IndianRupee,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    title: "Payments on lock",
    description:
      "Nobody likes chasing money, so we secure customer payments upfront. When a task is marked complete, your bank account will know about it.",
    cta: "Get paid quickly and securely",
  },
  {
    icon: Shield,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50",
    title: "Peace of mind, insured",
    description:
      "Liability insurance is sorted for Taskers performing most Tasks. JobPool Insurance is provided by reputable insurance brands.",
    cta: "Work with confidence and protection",
  },
];

export function MobileEarnAsTasker() {
  return (
    <section className="md:hidden px-4 py-8 bg-slate-100">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center">
          Earn Money as a Tasker
        </h2>
        <p className="mt-2 text-gray-600 text-sm text-center">
          Join thousands of Taskers who are earning money by helping others with their tasks.
        </p>

        <div className="grid grid-cols-1 gap-4 mt-6">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
              >
                <div className={`p-2 ${card.bgColor} rounded-full inline-block mb-3`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <h3 className="text-base font-bold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{card.description}</p>
                <p className="text-sm font-medium text-green-600 mt-2">{card.cta}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
            <Link href="/signup" className="inline-flex items-center gap-2">
              Join JobPool <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 rounded-xl">
            <Link href="/signup">Earn Money</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default MobileEarnAsTasker;
