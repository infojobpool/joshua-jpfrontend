"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  /** Optional custom illustration (SVG) - when provided, replaces the icon */
  illustration?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, illustration }: EmptyStateProps) {
  return (
    <div className="min-h-[320px] flex items-center justify-center py-16 px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex justify-center">
          {illustration ? (
            <div className="w-24 h-24 flex items-center justify-center">{illustration}</div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Icon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
