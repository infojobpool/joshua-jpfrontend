"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => onOpenChange(false);

  return (
    <dialog
      ref={ref}
      onClose={handleCancel}
      onCancel={handleCancel}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-md rounded-lg border bg-white p-6 shadow-lg [&::backdrop]:bg-black/50 dark:bg-slate-900 dark:border-slate-700"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          {cancelText}
        </Button>
        <Button variant="destructive" onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </dialog>
  );
}
