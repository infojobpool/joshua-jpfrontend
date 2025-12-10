"use client";

import { SafetyTips } from "@/components/SafetyTips";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";

export default function SafetyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainHeader />
      <main className="flex-1 container mx-auto max-w-4xl py-8 md:py-12 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Safety Tips</h1>
          <p className="text-muted-foreground">
            Your safety is our priority. Follow these guidelines to ensure a safe experience on JobPool.
          </p>
        </div>
        <SafetyTips />
      </main>
      <Footer />
    </div>
  );
}


