"use client";

import { AlertCircle, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const triggerBase =
  "flex w-full items-start gap-2 py-2.5 pl-2 pr-1 text-left hover:no-underline [&[data-state=open]>svg:last-child]:rotate-180";

export function SafetyTips() {
  return (
    <div className="overflow-hidden rounded-xl border-0 bg-white/90 shadow-lg shadow-orange-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
      {/* Header */}
      <div className="border-b border-gray-100/50 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 p-3">
        <h2 className="flex items-center gap-1.5 bg-gradient-to-r from-orange-900 via-red-900 to-pink-900 bg-clip-text text-sm font-bold text-transparent">
          <div className="rounded bg-orange-100 p-1">
            <AlertCircle className="h-3 w-3 text-orange-600" />
          </div>
          Safety Tips
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-slate-600">Tap a row to expand or collapse details.</p>
      </div>

      <div className="p-3">
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem
            value="pay"
            className="overflow-hidden rounded-lg border-0 border-red-200/50 bg-gradient-to-r from-red-50 to-orange-50 ring-1 ring-red-200/40"
          >
            <AccordionTrigger className={triggerBase}>
              <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1">
                <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <span className="min-w-0 flex-1 text-xs font-medium text-gray-800">
                Never pay or communicate outside of JobPool
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2 pl-2 pr-2 pt-0 text-xs text-gray-600">
              Keep all transactions within our secure platform
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="report"
            className="overflow-hidden rounded-lg border-0 border-yellow-200/50 bg-gradient-to-r from-yellow-50 to-orange-50 ring-1 ring-yellow-200/45"
          >
            <AccordionTrigger className={triggerBase}>
              <div className="mt-0.5 shrink-0 rounded-full bg-yellow-100 p-1">
                <svg className="h-3 w-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="min-w-0 flex-1 text-xs font-medium text-gray-800">
                Report suspicious behavior immediately
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2 pl-2 pr-2 pt-0 text-xs text-gray-600">
              Help keep our community safe
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="reviews"
            className="overflow-hidden rounded-lg border-0 border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 ring-1 ring-blue-200/45"
          >
            <AccordionTrigger className={triggerBase}>
              <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1">
                <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="min-w-0 flex-1 text-xs font-medium text-gray-800">
                Check reviews and ratings before accepting offers
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2 pl-2 pr-2 pt-0 text-xs text-gray-600">
              Review user profiles and feedback
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="priority"
            className="jp-bg-blue-pattern overflow-hidden rounded-lg border border-blue-200/60 ring-1 ring-blue-100/50"
          >
            <AccordionTrigger className={triggerBase}>
              <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1">
                <Shield className="h-3 w-3 text-blue-700" strokeWidth={2.5} aria-hidden />
              </div>
              <span className="min-w-0 flex-1 text-xs font-medium text-blue-900">Your safety is our priority</span>
            </AccordionTrigger>
            <AccordionContent className="pb-2 pl-2 pr-2 pt-0 text-xs text-blue-800/90">
              Secure payment processing and dispute resolution
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
