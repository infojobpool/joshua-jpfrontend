"use client";

import React from "react";
import Image from "next/image";

export function MobileHeroBanner() {
  return (
    <div className="md:hidden px-4 pt-4 bg-white">
      <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-md">
        <Image
          src="/images/banner.png"
          alt="JobPool Hero Banner"
          fill
          className="object-cover"
          priority
          sizes="(max-width:768px) 100vw, 600px"
        />
      </div>
    </div>
  );
}

export default MobileHeroBanner;


