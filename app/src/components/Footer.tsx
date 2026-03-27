"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { analytics } from "@/lib/analytics";
import { useCompactAppFooter } from "@/hooks/useCompactAppFooter";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/in/app/jobpool-official/id6757442431";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=in.jobpool.www.twa&hl=en_IN";

const COMPANY_ADDRESS = "8-3-169/60/438, Indira Nagar Colony Road, Yousufguda, Hyderabad, Telangana, 500045, India";

const socialLinks = [
  { name: "Facebook", href: "https://www.facebook.com/people/Job-Pool-India/100095047053131/", icon: Facebook },
  { name: "X (Twitter)", href: "https://x.com/jobpoolindia?s=21", icon: Twitter },
  { name: "Instagram", href: "https://www.instagram.com/jobpool_bharat/", icon: Instagram },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/job-pool/posts/?feedView=all", icon: Linkedin },
];

/** Minimal footer for native iOS/Android shell — legal, support, brand only. */
function AppShellFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-md px-6 py-10 sm:py-12">
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-white/95 p-2 shadow-sm ring-1 ring-white/10 transition hover:bg-white"
          >
            <img src="/images/new-logo.png" alt="JobPool" className="h-9 w-auto" />
          </Link>
          <div className="mt-8 w-full space-y-3">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.appDownloadClick("play_store")}
              className="mx-auto block w-fit rounded-lg transition hover:opacity-95"
            >
              <Image
                src="/images/store/footer-google-play.png"
                alt="Get it on Google Play"
                width={487}
                height={134}
                className="h-12 w-auto object-contain"
              />
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.appDownloadClick("app_store")}
              className="mx-auto block w-fit rounded-lg transition hover:opacity-95"
            >
              <Image
                src="/images/store/footer-app-store.png"
                alt="Download on the App Store"
                width={487}
                height={134}
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>
          <div className="mt-7 flex items-center gap-3">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-blue-600 hover:text-white"
                aria-label={name}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <nav
            className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-medium tracking-wide text-slate-400"
            aria-label="Legal and support"
          >
            <Link href="/privacy-policy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/termsandconditions" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/support" className="transition hover:text-white">
              Support
            </Link>
          </nav>
          <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600">
            © {new Date().getFullYear()} Klughire Pvt Limited
          </p>
        </div>
      </div>
    </footer>
  );
}

const Footer: React.FC = () => {
  const compact = useCompactAppFooter();
  if (compact) {
    return <AppShellFooter />;
  }

  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand + Social */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 shadow-lg">
                  <img
                    src="/images/new-logo.png"
                    alt="JobPool"
                    className="h-14 w-auto md:h-16"
                  />
                </div>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-400">
              Connect with skilled professionals to get your tasks done quickly and efficiently.
            </p>
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Follow us
              </p>
              <div className="flex gap-3">
                {socialLinks.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition hover:bg-blue-600 hover:text-white"
                    aria-label={name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/post-task" className="text-slate-400 transition hover:text-white">
                  Post a Task
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-slate-400 transition hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-slate-400 transition hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-slate-400 transition hover:text-white">
                  Browse Tasks
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/support" className="text-slate-400 transition hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 transition hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-slate-400 transition hover:text-white">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/support?tab=faq" className="text-slate-400 transition hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company + Address + App Download */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Company
              </h3>
              <p className="mt-3 text-sm text-slate-400">
                {COMPANY_ADDRESS}
              </p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/aboutus" className="text-slate-400 transition hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-400 transition hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-slate-400 transition hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/termsandconditions" className="text-slate-400 transition hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Download on App Store / Google Play */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Get the app
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analytics.appDownloadClick("play_store")}
                  className="inline-block rounded-lg transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Image
                    src="/images/store/footer-google-play.png"
                    alt="Get it on Google Play"
                    width={487}
                    height={134}
                    className="h-12 w-auto sm:h-14 md:h-16 object-contain drop-shadow-lg"
                  />
                </a>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analytics.appDownloadClick("app_store")}
                  className="inline-block rounded-lg transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Image
                    src="/images/store/footer-app-store.png"
                    alt="Download on the App Store"
                    width={487}
                    height={134}
                    className="h-12 w-auto sm:h-14 md:h-16 object-contain drop-shadow-lg"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-white">
              © 2023 Klughire Pvt Limited. All rights reserved.
            </p>
            <p className="mt-1.5 text-sm font-semibold text-blue-400">
              A product by Klughire®
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/privacy-policy" className="text-slate-400 transition hover:text-white">
              Privacy
            </Link>
            <Link href="/termsandconditions" className="text-slate-400 transition hover:text-white">
              Terms
            </Link>
            <a
              href="https://www.facebook.com/people/Job-Pool-India/100095047053131/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-white"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/jobpool_bharat/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/company/job-pool/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-white"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
            <a
              href="mailto:info@jobpool.in"
              className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-white"
            >
              <Mail className="h-4 w-4" />
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
