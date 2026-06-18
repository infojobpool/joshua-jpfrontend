/** Public marketing routes editable via admin Page SEO + public-page-seo API. */

export type StaticPageSeoFallback = {
  path: string;
  label: string;
  title: string;
  description: string;
};

export const PUBLIC_STATIC_SEO_PAGES: StaticPageSeoFallback[] = [
  {
    path: "/",
    label: "Homepage",
    title: "JobPool — Get everyday tasks done",
    description:
      "Post tasks and hire verified taskers across India. Home services, repairs, delivery, and skilled help on JobPool.",
  },
  {
    path: "/browse",
    label: "Browse tasks",
    title: "Browse tasks",
    description:
      "Browse open tasks on JobPool. Find local jobs, offer your skills, and get hired for home services and more across India.",
  },
  {
    path: "/browse-tasks",
    label: "Browse tasks (alt)",
    title: "Browse tasks",
    description: "Find local tasks to bid on across India on JobPool.",
  },
  {
    path: "/listings",
    label: "Service listings",
    title: "Service listings",
    description:
      "Explore published services and products from JobPool providers. Compare pricing, photos, and locations.",
  },
  {
    path: "/blog",
    label: "Blog",
    title: "Blog",
    description:
      "Articles, tips, and updates from JobPool — India's marketplace to post tasks and hire skilled help.",
  },
  {
    path: "/aboutus",
    label: "About us",
    title: "About JobPool",
    description: "Learn about JobPool — India's task marketplace connecting people who need help with skilled taskers.",
  },
  {
    path: "/how-it-works",
    label: "How it works",
    title: "How JobPool works",
    description: "See how to post a task, receive offers, hire a tasker, and pay securely on JobPool.",
  },
  {
    path: "/faq",
    label: "FAQ",
    title: "FAQ",
    description: "Frequently asked questions about posting tasks, bidding, payments, and safety on JobPool.",
  },
  {
    path: "/support",
    label: "Support",
    title: "Support",
    description: "Get help with your JobPool account, tasks, payments, and verification.",
  },
  {
    path: "/supportpage",
    label: "Support center",
    title: "Support center",
    description: "Help articles, FAQs, and contact options for JobPool users.",
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact JobPool",
    description: "Contact the JobPool team for support, partnerships, or general inquiries.",
  },
  {
    path: "/careers",
    label: "Careers",
    title: "Careers at JobPool",
    description: "Explore career opportunities and join the team building India's task marketplace.",
  },
  {
    path: "/categories",
    label: "Categories",
    title: "Task categories",
    description: "Browse JobPool task categories — home services, delivery, events, repairs, and more.",
  },
  {
    path: "/safety",
    label: "Safety",
    title: "Safety on JobPool",
    description: "Safety tips and trust guidelines for task posters and taskers on JobPool.",
  },
  {
    path: "/privacy-policy",
    label: "Privacy policy",
    title: "Privacy policy",
    description: "How JobPool collects, uses, and protects your personal information.",
  },
  {
    path: "/termsandconditions",
    label: "Terms and conditions",
    title: "Terms and conditions",
    description: "Terms of use for the JobPool platform and services.",
  },
  {
    path: "/listing-request",
    label: "Listing request",
    title: "Request a listing",
    description: "Request to publish a service listing on JobPool.",
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
