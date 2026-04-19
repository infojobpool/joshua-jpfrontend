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
    description: "Post tasks or browse offers on the go.",
    cta: "Earn up to ₹50,000/mo",
  },
  {
    icon: Clock,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    title: "All on your terms",
    description: "Pick jobs that fit your schedule.",
    cta: "Flexible work",
  },
  {
    icon: IndianRupee,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    title: "Payments on lock",
    description: "Funds held until the task is done.",
    cta: "Paid securely",
  },
  {
    icon: Shield,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50",
    title: "Peace of mind, insured",
    description: "Coverage for eligible Task work.",
    cta: "Work protected",
  },
];

export function MobileEarnAsTasker() {
  return (
    <section className="md:hidden bg-slate-100 px-4 py-4">
      <div className="mx-auto max-w-lg">
        <h2 className="text-center text-lg font-bold tracking-tight text-gray-900">Earn as a Tasker</h2>
        <p className="mt-1 text-center text-xs text-gray-600">
          Help others locally and get paid for your skills.
        </p>

        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="snap-center shrink-0 w-[min(17.5rem,calc(100vw-3.5rem))] rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className={`inline-flex rounded-full p-1.5 ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                <h3 className="mt-2 text-sm font-bold leading-snug text-gray-900">{card.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{card.description}</p>
                <p className="mt-1.5 text-[11px] font-semibold text-green-700">{card.cta}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Button asChild className="h-10 rounded-xl bg-green-600 text-sm hover:bg-green-700">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2">
              Join JobPool <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl border-green-600 text-sm text-green-700 hover:bg-green-50">
            <Link href="/signup">Earn Money</Link>
          </Button>
        </div>

        <p className="mt-2 text-center">
          <Link href="/how-it-works" className="text-[11px] font-medium text-slate-500 hover:text-blue-600">
            Full Tasker guide
          </Link>
        </p>
      </div>
    </section>
  );
}

export default MobileEarnAsTasker;
