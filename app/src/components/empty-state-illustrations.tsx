"use client";

/** Search / no results - magnifying glass over document */
export function SearchEmptyIllustration() {
  return (
    <svg viewBox="0 0 96 96" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="16" y="24" width="48" height="56" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <line x1="24" y1="36" x2="48" y2="36" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="44" x2="44" y2="44" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="52" x2="40" y2="52" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <circle cx="56" cy="40" r="16" fill="none" stroke="#2563eb" strokeWidth="3" />
      <rect x="66" y="50" width="6" height="20" rx="2" transform="rotate(45 69 60)" fill="#2563eb" />
    </svg>
  );
}

/** Briefcase - no assigned tasks */
export function BriefcaseEmptyIllustration() {
  return (
    <svg viewBox="0 0 96 96" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="20" y="36" width="56" height="40" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <path d="M20 44h56" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="36" y="24" width="24" height="16" rx="4" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
      <rect x="32" y="28" width="32" height="8" rx="2" fill="#3b82f6" opacity="0.8" />
    </svg>
  );
}
