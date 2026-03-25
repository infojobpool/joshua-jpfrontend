import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, style, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      style={{
        color: "#0f172a",
        WebkitTextFillColor: "#0f172a",
        caretColor: "#0f172a",
        ...style,
      }}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-white px-3 py-2 text-base text-slate-900 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-white dark:text-slate-900",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
