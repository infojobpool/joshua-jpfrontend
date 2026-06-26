"use client";

import { useCallback, useEffect, useState } from "react";
import { OffersSection, type OffersSectionProps } from "@/components/OffersSection";
import { TaskPublicQuestionsSection } from "@/components/TaskPublicQuestionsSection";
import { fetchTaskPublicQuestions } from "@/lib/taskPublicQaApi";
import { offersCountLabel } from "@/lib/jobBids";

/** Same props as OffersSection plus poster id for Q&A permissions */
export type TaskOffersQuestionsTabsProps = OffersSectionProps & {
  posterId: string;
  /** Increment to refetch Q&A tab (e.g. task reload) */
  qaRefreshKey?: number;
};

export function TaskOffersQuestionsTabs(props: TaskOffersQuestionsTabsProps) {
  const { posterId, qaRefreshKey = 0, task, offers, bidsTotal, bidsHasMore, ...offersRest } = props;
  const [tab, setTab] = useState<"offers" | "questions">("offers");
  const [qaTotal, setQaTotal] = useState<number | null>(null);
  const [questionsMounted, setQuestionsMounted] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const meta = await fetchTaskPublicQuestions(task.id, 1, 0);
        if (alive) setQaTotal(meta.total);
      } catch {
        if (alive) setQaTotal(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [task.id, qaRefreshKey]);

  const onMetaChange = useCallback((m: { total: number }) => {
    setQaTotal(m.total);
  }, []);

  const goQuestions = () => {
    setTab("questions");
    setQuestionsMounted(true);
  };

  const pill =
    "flex-1 rounded-xl py-2.5 px-3 text-sm font-semibold transition-all duration-200 min-h-[44px] touch-manipulation";
  const active = "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80";
  const idle =
    "text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-800/50";

  return (
    <div className="space-y-3">
      <div
        className="flex rounded-2xl bg-slate-100/95 dark:bg-slate-800/60 p-1 gap-1 border border-slate-200/70 dark:border-slate-700/80"
        role="tablist"
        aria-label="Offers and questions"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "offers"}
          className={`${pill} ${tab === "offers" ? active : idle}`}
          onClick={() => setTab("offers")}
        >
          Offers ({offersCountLabel(offers.length, bidsTotal)})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "questions"}
          className={`${pill} ${tab === "questions" ? active : idle}`}
          onClick={goQuestions}
        >
          Questions ({qaTotal ?? "–"})
        </button>
      </div>

      <div role="tabpanel" hidden={tab !== "offers"} className={tab !== "offers" ? "hidden" : ""}>
        <OffersSection
          task={task}
          offers={offers}
          bidsTotal={bidsTotal}
          bidsHasMore={bidsHasMore}
          {...offersRest}
        />
      </div>

      {(questionsMounted || tab === "questions") && (
        <div
          role="tabpanel"
          hidden={tab !== "questions"}
          className={tab !== "questions" ? "hidden" : ""}
        >
          <TaskPublicQuestionsSection
            taskId={task.id}
            posterId={posterId}
            currentUserId={props.currentUserId}
            isTaskPoster={props.isTaskPoster}
            refreshKey={qaRefreshKey}
            onMetaChange={onMetaChange}
          />
        </div>
      )}
    </div>
  );
}
