"use client";

import React from "react";
import Image from "next/image";

export function MobileHeroBanner() {
  return (
    <div className="md:hidden bg-white px-4 pt-2">
      <div className="relative aspect-[2/1] max-h-40 w-full min-h-[7.5rem] overflow-hidden rounded-xl bg-[#0a1744] shadow-md">
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


