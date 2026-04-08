"use client";

import React from "react";
import { usePublicTestimonials } from "@/hooks/usePublicTestimonials";

export function MobileTestimonials() {
  const { items } = usePublicTestimonials();

  if (items.length === 0) {
    return null;
  }

  const loop = [...items, ...items];

  return (
    <div className="md:hidden px-4 py-4 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">What people say</h3>
      <div className="overflow-hidden pb-2">
        <div className="flex gap-3 w-max animate-marquee will-change-transform">
          {loop.map((t, idx) => (
            <div
              key={`${t.id}-${idx}`}
              className="shrink-0 w-72 snap-start rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-md shadow-lg shadow-black/5 p-3"
            >
              <div className="flex items-center mb-1">
                {t.avatarUrl ? (
                  <div className="mr-2 h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-200">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote avatar URLs from API */}
                    <img
                      src={t.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white ring-2 ring-blue-200">
                    {t.name.substring(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{t.name}</div>
                  {t.role ? (
                    <div className="truncate text-xs text-gray-500">{t.role}</div>
                  ) : null}
                </div>
              </div>
              <div className="text-xs text-amber-500">
                {"★".repeat(Math.min(5, Math.max(1, t.rating)))}
                <span className="ml-1 text-gray-600">{t.rating.toFixed(1)}</span>
              </div>
              <div className="relative mt-2">
                <span className="absolute -left-1 -top-2 text-2xl text-blue-600/20">&ldquo;</span>
                <p className="pl-2 text-sm leading-5 text-gray-700 line-clamp-4">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marquee 14s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

export default MobileTestimonials;
