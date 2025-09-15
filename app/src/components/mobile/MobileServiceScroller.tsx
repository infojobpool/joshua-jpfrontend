"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

type Service = {
  id: string;
  title: string;
  subtitle: string;
  rating: string;
  reviews: string;
  image: string;
};

const SERVICES: Service[] = [
  {
    id: "moving",
    title: "Moving & Delivery",
    subtitle: "Reliable movers for transport needs",
    rating: "4.7",
    reviews: "1,500+",
    image: "/images/image1.jpeg", // tasker at work (photo)
  },
  {
    id: "cleaning",
    title: "House Cleaning",
    subtitle: "Professional cleaning for home & office",
    rating: "4.8",
    reviews: "1,800+",
    image: "/images/caregiving-hero.jpg", // photo backdrop
  },
  {
    id: "assembly",
    title: "Assembly",
    subtitle: "Furniture and flatpack assembly",
    rating: "4.9",
    reviews: "900+",
    image: "/images/image2.jpeg", // tasker photo
  },
  {
    id: "mounting",
    title: "TV Mounting",
    subtitle: "Secure and tidy installations",
    rating: "4.9",
    reviews: "1,000+",
    image: "/images/mobileapp.png", // fallback photo
  },
];

export function MobileServiceScroller() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let paused = false;
    const speed = 2.5; // px per frame
    let rafId = 0;

    const tick = () => {
      if (!el) return;
      if (!paused) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          const next = el.scrollLeft + speed;
          el.scrollLeft = next >= max ? 0 : next;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    // Start shortly after mount to ensure layout is ready
    const startId = window.setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, 50);

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    const onVisibility = () => { paused = document.hidden; };
    el.addEventListener("touchstart", onEnter, { passive: true });
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchend", onLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(startId);
      cancelAnimationFrame(rafId);
      el.removeEventListener("touchstart", onEnter);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchend", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="md:hidden px-4 py-4 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Popular Services</h3>
      <p className="text-sm text-gray-500 mb-3">Find help for common tasks</p>
      <div className="overflow-hidden pb-2">
        <div ref={trackRef} className="flex gap-3 w-max" style={{ WebkitOverflowScrolling: "touch" }}>
          {[...SERVICES, ...SERVICES].map((s, idx) => (
          <div
            key={`${s.id}-${idx}`}
            className="shrink-0 w-64 snap-start rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-md shadow-lg shadow-black/5 overflow-hidden"
          >
            <div className="relative h-32 w-full overflow-hidden bg-gray-50">
              <Image src={s.image} alt={s.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0" />
              <div className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded-full bg-white/90 text-gray-800 flex items-center gap-1">
                <span>★</span>
                <span className="font-medium">{s.rating}</span>
                <span className="text-gray-500">({s.reviews})</span>
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-semibold text-gray-900">{s.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{s.subtitle}</p>
            </div>
          </div>
          ))}
        </div>
        <style jsx>{`
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          div[ref] { will-change: transform; }
          .w-max { animation: marquee 12s linear infinite; }
        `}</style>
      </div>
    </div>
  );
}

export default MobileServiceScroller;


