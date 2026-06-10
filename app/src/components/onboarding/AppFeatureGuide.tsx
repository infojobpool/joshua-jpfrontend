"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  APP_GUIDE_STEPS,
  markAppGuideCompleted,
  type AppGuideStep,
  type TourPlacement,
} from "@/lib/appFeatureGuide";
import { useAppFeatureGuideStore } from "@/lib/appFeatureGuideStore";
import { findVisibleTourTarget } from "@/lib/appTourTargets";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const PAD = 8;
const TOOLTIP_W = 300;

type TargetRect = { top: number; left: number; width: number; height: number };

function useTourTarget(tourTargets: string[] | undefined, active: boolean, stepIndex: number) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [found, setFound] = useState(false);
  const [matchedId, setMatchedId] = useState<string | null>(null);

  const measure = useCallback(() => {
    if (!tourTargets?.length) {
      setRect(null);
      setFound(false);
      setMatchedId(null);
      return;
    }
    const hit = findVisibleTourTarget(tourTargets);
    if (!hit) {
      setRect(null);
      setFound(false);
      setMatchedId(null);
      return;
    }
    const r = hit.el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
    setFound(true);
    setMatchedId(hit.id);
  }, [tourTargets]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const t = window.setTimeout(measure, 80);
    return () => window.clearTimeout(t);
  }, [active, measure, stepIndex]);

  useEffect(() => {
    if (!active || !tourTargets?.length) return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const hit = findVisibleTourTarget(tourTargets);
    const ro = hit ? new ResizeObserver(measure) : null;
    if (hit && ro) ro.observe(hit.el);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      ro?.disconnect();
    };
  }, [active, tourTargets, measure, stepIndex]);

  return { rect, found, matchedId };
}

function ScrimPanels({ rect }: { rect: TargetRect }) {
  const t = Math.max(0, rect.top - PAD);
  const l = Math.max(0, rect.left - PAD);
  const r = rect.left + rect.width + PAD;
  const b = rect.top + rect.height + PAD;
  const panel = "fixed bg-black/70 pointer-events-auto transition-opacity duration-200";

  return (
    <>
      <div className={panel} style={{ top: 0, left: 0, right: 0, height: t }} aria-hidden />
      <div className={panel} style={{ top: t, left: 0, width: l, height: b - t }} aria-hidden />
      <div className={panel} style={{ top: t, left: r, right: 0, height: b - t }} aria-hidden />
      <div className={panel} style={{ top: b, left: 0, right: 0, bottom: 0 }} aria-hidden />
    </>
  );
}

function SpotlightRing({ rect }: { rect: TargetRect }) {
  return (
    <div
      className="pointer-events-none fixed rounded-2xl ring-[3px] ring-blue-400 ring-offset-2 ring-offset-transparent shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all duration-200"
      style={{
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }}
      aria-hidden
    />
  );
}

function TourTooltipCard({
  step,
  stepIndex,
  total,
  placement,
  anchorRect,
  centered,
  onBack,
  onNext,
  onSkip,
  isFirst,
  isLast,
}: {
  step: AppGuideStep;
  stepIndex: number;
  total: number;
  placement: TourPlacement;
  anchorRect: TargetRect | null;
  centered: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 16 });

  useLayoutEffect(() => {
    if (centered || !anchorRect) {
      setPos({ left: Math.max(16, (window.innerWidth - TOOLTIP_W) / 2) });
      return;
    }
    const centerX = anchorRect.left + anchorRect.width / 2;
    const left = Math.max(
      16,
      Math.min(window.innerWidth - TOOLTIP_W - 16, centerX - TOOLTIP_W / 2)
    );
    if (placement === "below") {
      setPos({ top: anchorRect.top + anchorRect.height + PAD + 12, left });
    } else {
      setPos({ bottom: window.innerHeight - anchorRect.top + PAD + 12, left });
    }
  }, [anchorRect, centered, placement]);

  const card = (
    <div
      className={cn(
        "pointer-events-auto w-[min(300px,calc(100vw-32px))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl dark:border-slate-600 dark:bg-slate-900",
        centered && "relative"
      )}
      style={centered ? undefined : { position: "fixed", zIndex: 9999, width: TOOLTIP_W, ...pos }}
      role="dialog"
      aria-labelledby="app-tour-title"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          Step {stepIndex + 1} of {total}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h2 id="app-tour-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">
        {step.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>
      {step.desktopTip ? (
        <p className="mt-2 hidden text-xs text-slate-500 md:block dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">Desktop: </span>
          {step.desktopTip}
        </p>
      ) : null}
      {!centered && anchorRect ? (
        <div
          className={cn(
            "absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-900",
            placement === "below" ? "-top-1.5 border-b-0 border-r-0" : "-bottom-1.5 border-l-0 border-t-0"
          )}
          aria-hidden
        />
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={onSkip} className="text-xs font-medium text-slate-500 hover:text-slate-700">
          Skip tour
        </button>
        <div className="flex gap-2">
          {!isFirst ? (
            <Button type="button" variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
          ) : null}
          <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onNext}>
            {isLast ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (centered) {
    return (
      <div className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {card}
      </div>
    );
  }

  return card;
}

export function AppFeatureGuide() {
  const open = useAppFeatureGuideStore((s) => s.open);
  const closeGuide = useAppFeatureGuideStore((s) => s.closeGuide);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const step = APP_GUIDE_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === APP_GUIDE_STEPS.length - 1;
  const wantsTarget = Boolean(step?.tourTargets?.length);
  const { rect, found, matchedId } = useTourTarget(step?.tourTargets, open, index);
  const placement: TourPlacement =
    matchedId?.startsWith("tour-nav-") ? "above" : step?.placement ?? "below";
  const centered = !wantsTarget || !found || placement === "center";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const finish = useCallback(() => {
    markAppGuideCompleted();
    closeGuide();
  }, [closeGuide]);

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => Math.min(i + 1, APP_GUIDE_STEPS.length - 1));
  };

  const goBack = () => setIndex((i) => Math.max(i - 1, 0));

  if (!open || !mounted || !step) return null;

  const content = (
    <div className="fixed inset-0 z-[9998]" aria-modal="true">
      {centered ? (
        <div className="fixed inset-0 bg-black/70 pointer-events-auto" aria-hidden />
      ) : rect ? (
        <>
          <ScrimPanels rect={rect} />
          <SpotlightRing rect={rect} />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/70 pointer-events-auto" aria-hidden />
      )}

      <TourTooltipCard
        step={step}
        stepIndex={index}
        total={APP_GUIDE_STEPS.length}
        placement={placement}
        anchorRect={centered ? null : rect}
        centered={centered}
        onBack={goBack}
        onNext={goNext}
        onSkip={finish}
        isFirst={isFirst}
        isLast={isLast}
      />
    </div>
  );

  return createPortal(content, document.body);
}
