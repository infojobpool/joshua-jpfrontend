"use client";

import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/in/app/jobpool-official/id6757442431";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=in.jobpool.www.twa&hl=en_IN";

const socialLinks = [
  { name: "Facebook", href: "https://www.facebook.com/people/Job-Pool-India/100095047053131/", icon: Facebook },
  { name: "X (Twitter)", href: "https://x.com/jobpoolindia?s=21", icon: Twitter },
  { name: "Instagram", href: "https://www.instagram.com/jobpool_bharat/", icon: Instagram },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/job-pool/posts/?feedView=all", icon: Linkedin },
];

const Footer: React.FC = () => {
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

          {/* Company + App Download */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Company
              </h3>
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
              <div className="mt-4 relative w-full max-w-[200px]">
                <img
                  src="/images/app-download-buttons.png"
                  alt="Download on the App Store and Get it on Google Play"
                  className="w-full h-auto"
                />
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-x-0 top-0 h-1/2 cursor-pointer"
                  aria-label="Download on the App Store"
                />
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-x-0 top-1/2 h-1/2 cursor-pointer"
                  aria-label="Get it on Google Play"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-center text-sm font-semibold text-white md:text-left">
            © 2023 Klughire Pvt Limited. All rights reserved.
          </p>
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
