/** Mirrors app/src/lib/seo/publicStaticPages.ts for admin Page SEO UI. */

export type StaticPageSeoFallback = {
  path: string;
  label: string;
  title: string;
  description: string;
  keywords?: string;
};

export const PUBLIC_STATIC_SEO_PAGES: StaticPageSeoFallback[] = [
  {
    path: "/",
    label: "Homepage",
    title: "JobPool — Hire Taskers for Home & Local Jobs in India",
    description:
      "Post tasks on JobPool and hire verified taskers for cleaning, repairs, delivery, and skilled help. Get offers, pay securely, and get work done across India.",
    keywords: "jobpool, hire taskers, post a task, home services India, local jobs, task marketplace",
  },
  {
    path: "/browse",
    label: "Browse tasks",
    title: "Browse Tasks & Gigs on JobPool India",
    description:
      "Find open tasks near you on JobPool. Bid on home services, delivery, repairs, and local gigs. Earn on your schedule as a tasker in India.",
    keywords: "browse tasks, find gigs, tasker jobs India, earn money tasks, local tasks near me",
  },
  {
    path: "/browse-tasks",
    label: "Browse tasks (alt)",
    title: "Browse Tasks on JobPool",
    description: "Find local tasks to bid on across India on JobPool.",
    keywords: "browse tasks, jobpool tasks, local gigs India",
  },
  {
    path: "/listings",
    label: "Service listings",
    title: "Service Listings — Find Local Providers | JobPool",
    description:
      "Explore published services and products from JobPool providers. Compare photos, pricing, and locations before you hire.",
    keywords: "service listings, hire local services, jobpool providers, home services listings India",
  },
  {
    path: "/blog",
    label: "Blog",
    title: "JobPool Blog — Tips for Tasks, Hiring & Earning",
    description:
      "Articles, guides, and updates from JobPool — India's marketplace to post tasks, hire skilled help, and earn as a tasker.",
    keywords: "jobpool blog, hire help tips, task marketplace India, earn money guides",
  },
  {
    path: "/aboutus",
    label: "About us",
    title: "About JobPool — India's Task Marketplace",
    description:
      "Learn about JobPool and Klughire Private Limited — connecting people who need tasks done with skilled taskers across India.",
    keywords: "about jobpool, klughire, task marketplace India, hire taskers",
  },
  {
    path: "/how-it-works",
    label: "How it works",
    title: "How JobPool Works — Post, Hire & Pay Safely",
    description:
      "See how to post a task, receive offers from taskers, hire the right person, and pay securely on JobPool.",
    keywords: "how jobpool works, post a task, hire tasker, secure payment tasks",
  },
  {
    path: "/faq",
    label: "FAQ",
    title: "JobPool FAQ — Tasks, Payments & Verification",
    description:
      "Answers to common questions about posting tasks, bidding, payments, fees, verification, and safety on JobPool.",
    keywords: "jobpool faq, task payment help, verification, platform fees",
  },
  {
    path: "/pricing",
    label: "Pricing & fees",
    title: "JobPool Pricing & Fees — Transparent Task Payments",
    description:
      "See how JobPool platform fees and GST work for task posters and taskers. Live estimates from our fee calculator — no hidden charges.",
    keywords: "jobpool fees, platform fee, task payment charges, GST on platform fee India",
  },
  {
    path: "/for-posters",
    label: "For task posters",
    title: "For Task Posters — Hire Help on JobPool",
    description:
      "Need something done? Post a task on JobPool, compare offers from verified taskers, and pay securely when the job is complete.",
    keywords: "post a task, hire help home, taskmaster jobpool, hire tasker India",
  },
  {
    path: "/for-taskers",
    label: "For taskers",
    title: "For Taskers — Earn Money on JobPool",
    description:
      "Turn your skills and free time into income. Browse tasks on JobPool, submit bids, and get paid for work that fits your schedule.",
    keywords: "earn money tasks, become a tasker, gig jobs India, jobpool tasker",
  },
  {
    path: "/support",
    label: "Support",
    title: "JobPool Support — Help with Your Account",
    description: "Get help with your JobPool account, tasks, payments, and verification.",
    keywords: "jobpool support, help center, contact support",
  },
  {
    path: "/supportpage",
    label: "Support center",
    title: "JobPool Support Center",
    description: "Help articles, FAQs, and contact options for JobPool users.",
    keywords: "jobpool help, support center, faq",
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact JobPool",
    description: "Contact the JobPool team for support, partnerships, or general inquiries.",
    keywords: "contact jobpool, jobpool email, partnerships",
  },
  {
    path: "/careers",
    label: "Careers",
    title: "Careers at JobPool",
    description: "Explore career opportunities and join the team building India's task marketplace.",
    keywords: "jobpool careers, jobs klughire, work at jobpool",
  },
  {
    path: "/categories",
    label: "Categories",
    title: "Task Categories — Cleaning, Delivery & More | JobPool",
    description:
      "Browse JobPool task categories — home cleaning, repairs, delivery, events, moving, and skilled services across India.",
    keywords: "task categories, home cleaning tasks, delivery gigs, repair services India",
  },
  {
    path: "/safety",
    label: "Safety",
    title: "Safety on JobPool — Trust & Secure Payments",
    description:
      "Safety tips and trust guidelines for task posters and taskers on JobPool. Verified profiles and secure payments.",
    keywords: "jobpool safety, verified taskers, secure task payment",
  },
  {
    path: "/privacy-policy",
    label: "Privacy policy",
    title: "JobPool Privacy Policy",
    description: "How JobPool collects, uses, and protects your personal information.",
    keywords: "jobpool privacy policy, data protection",
  },
  {
    path: "/termsandconditions",
    label: "Terms and conditions",
    title: "JobPool Terms and Conditions",
    description: "Terms of use for the JobPool platform and services.",
    keywords: "jobpool terms, terms of service",
  },
  {
    path: "/listing-request",
    label: "Listing request",
    title: "Request a Service Listing on JobPool",
    description: "Request to publish a service listing on JobPool and reach customers in your area.",
    keywords: "list your service, jobpool listing, provider signup",
  },
];

export function normalizeSeoPath(path: string): string {
  const trimmed = (path || "/").trim();
  if (!trimmed || trimmed === "/") return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function fallbackForPath(path: string): StaticPageSeoFallback | undefined {
  const key = normalizeSeoPath(path);
  return PUBLIC_STATIC_SEO_PAGES.find((p) => normalizeSeoPath(p.path) === key);
}

export type AdminPageSeoForm = {
  path: string;
  label: string;
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  meta_keywords: string;
  noindex: boolean;
  canonical_path: string;
};

export function emptyPageSeoForm(path: string): AdminPageSeoForm {
  const fb = fallbackForPath(path);
  const normalized = normalizeSeoPath(path);
  return {
    path: normalized,
    label: fb?.label ?? normalized,
    meta_title: fb?.title ?? "",
    meta_description: fb?.description ?? "",
    og_image_url: "",
    meta_keywords: fb?.keywords ?? "",
    noindex: false,
    canonical_path: normalized === "/" ? "/" : `${normalized}/`,
  };
}
