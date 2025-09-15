"use client";

import React from "react";
import Image from "next/image";

type Testimonial = {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
};

const TESTIMONIALS: Testimonial[] = [
  { id: "t1", name: "Nisha", text: "Found a great Tasker in minutes. Super smooth!", rating: 5, avatar: "/images/ava-nisha.jpg" },
  { id: "t2", name: "Rahul", text: "Clean and professional work. Highly recommend.", rating: 5, avatar: "/images/ava-rahul.jpeg" },
  { id: "t3", name: "Aisha", text: "Posted a task and got 4 offers quickly.", rating: 5, avatar: "/images/ava-aisha.jpeg" },
];

export function MobileTestimonials() {
  return (
    <div className="md:hidden px-4 py-4 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">What people say</h3>
      <div className="overflow-hidden pb-2">
        <div className="flex gap-3 w-max animate-marquee will-change-transform">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
          <div
            key={`${t.id}-${idx}`}
            className="shrink-0 w-72 snap-start rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-md shadow-lg shadow-black/5 p-3"
          >
            <div className="flex items-center mb-1">
              {t.avatar ? (
                <div className="mr-2 h-9 w-9 rounded-full overflow-hidden ring-2 ring-blue-200">
                  <Image src={t.avatar} alt={t.name} width={36} height={36} className="object-cover h-full w-full" />
                </div>
              ) : (
                <div className="mr-2 h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-200">
                  {t.name.substring(0,1)}
                </div>
              )}
              <div className="text-sm font-semibold text-gray-900">{t.name}</div>
            </div>
            <div className="text-xs text-amber-500">{"★".repeat(t.rating)}<span className="ml-1 text-gray-600">5.0</span></div>
            <div className="relative mt-2">
              <span className="absolute -top-2 -left-1 text-2xl text-blue-600/20">“</span>
              <p className="text-sm text-gray-700 leading-5 pl-2">{t.text}</p>
            </div>
          </div>
        ))}
        </div>
        <style jsx>{`
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 14s linear infinite; }
        `}</style>
      </div>
    </div>
  );
}

export default MobileTestimonials;


