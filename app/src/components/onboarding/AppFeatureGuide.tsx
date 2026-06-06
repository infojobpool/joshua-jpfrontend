"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  APP_GUIDE_STEPS,
  markAppGuideCompleted,
  type AppGuideStep,
} from "@/lib/appFeatureGuide";
import { useAppFeatureGuideStore } from "@/lib/appFeatureGuideStore";
import { GuideNavPreview } from "@/components/onboarding/GuideNavPreview";
import {
  Sparkles,
  Home,
  Search,
  Plus,
  MessageSquare,
  LayoutList,
  User,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  welcome: Sparkles,
  home: Home,
  tasks: Search,
  post: Plus,
  chat: MessageSquare,
  listings: LayoutList,
  profile: User,
  done: PartyPopper,
};

function StepIcon({ step }: { step: AppGuideStep }) {
  const Icon = STEP_ICONS[step.id] ?? Sparkles;
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
      <Icon className="h-7 w-7" aria-hidden />
    </div>
  );
}

export function AppFeatureGuide() {
  const open = useAppFeatureGuideStore((s) => s.open);
  const closeGuide = useAppFeatureGuideStore((s) => s.closeGuide);
  const [index, setIndex] = useState(0);

  const step = APP_GUIDE_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === APP_GUIDE_STEPS.length - 1;
  const progress = Math.round(((index + 1) / APP_GUIDE_STEPS.length) * 100);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const finish = useCallback(() => {
    markAppGuideCompleted();
    closeGuide();
  }, [closeGuide]);

  const handleOpenChange = (next: boolean) => {
    if (!next) finish();
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => Math.min(i + 1, APP_GUIDE_STEPS.length - 1));
  };

  const goBack = () => setIndex((i) => Math.max(i - 1, 0));

  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden border-slate-200 p-0 sm:max-w-md dark:border-slate-700"
        showCloseButton
      >
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-5 pb-4 pt-5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <StepIcon step={step} />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700/90 dark:text-blue-300">
                App guide · Step {index + 1} of {APP_GUIDE_STEPS.length}
              </p>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {step.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {step.body}
            </DialogDescription>
            {step.desktopTip ? (
              <p className="hidden text-xs leading-relaxed text-slate-500 md:block dark:text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">Desktop: </span>
                {step.desktopTip}
              </p>
            ) : null}
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <GuideNavPreview highlight={step.highlightNav} />
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-center gap-1.5">
              {APP_GUIDE_STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-5 bg-blue-600" : "w-1.5 bg-slate-300 dark:bg-slate-600"
                  )}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-500"
            onClick={finish}
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {!isFirst ? (
              <Button type="button" variant="outline" size="sm" onClick={goBack}>
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={goNext}
            >
              {isLast ? "Get started" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
