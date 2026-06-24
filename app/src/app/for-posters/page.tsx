"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Users, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Post your task",
    desc: "Describe what you need, set a budget, and add your location.",
    icon: ClipboardList,
  },
  {
    title: "Compare offers",
    desc: "Review bids from verified taskers — check ratings and profiles.",
    icon: Users,
  },
  {
    title: "Pay securely",
    desc: "Hire the best fit and pay through JobPool when you're ready.",
    icon: CreditCard,
  },
];

const perks = [
  "Cleaning, repairs, moving, delivery, tutoring, and skilled help",
  "Verified profiles and reviews from past tasks",
  "Transparent fees — see your total before you pay",
  "Support if something doesn't go as planned",
];

export default function ForPostersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16 md:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">For task posters</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Get everyday tasks done by trusted local help
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Post what you need on JobPool, receive offers from taskers, and hire with confidence — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/post-task">
                Post a task
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/listings">Browse service listings</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Why post on JobPool</h2>
              <ul className="mt-4 space-y-2 text-slate-600">
                {perks.map((item) => (
                  <li key={item} className="flex gap-2 text-sm md:text-base">
                    <span className="text-blue-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Questions about fees?{" "}
          <Link href="/pricing" className="font-medium text-blue-600 hover:underline">
            View pricing
          </Link>{" "}
          ·{" "}
          <Link href="/how-it-works" className="font-medium text-blue-600 hover:underline">
            How it works
          </Link>
        </p>
      </div>
    </div>
  );
}
