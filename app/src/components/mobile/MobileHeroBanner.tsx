"use client";

import React from "react";
import Image from "next/image";

export function MobileHeroBanner() {
  return (
    <div className="md:hidden px-4 pt-4 bg-white">
      <div className="relative w-full aspect-[21/9] min-h-[11rem] max-h-56 rounded-2xl overflow-hidden shadow-md bg-[#0a1744]">
        <Image
          src="/images/mobile-hero-get-hired-24h.png"
          alt="Get hired in 24 hours – JobPool"
          fill
          className="object-cover object-[50%_45%]"
          priority
          sizes="(max-width:768px) 100vw, 600px"
        />
      </div>
    </div>
  );
}

export default MobileHeroBanner;


