import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type StepStatus = {
  completed: boolean
  skipped: boolean
}

type Step = {
  name: string
  status: StepStatus
}

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: Step[]
}

export default function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex items-center">
              {index > 0 && (
                <div
                  className={cn("h-1 w-full", index < currentStep ? "bg-primary" : "bg-gray-200")}
                  style={{ width: `${100 / (totalSteps - 1)}%` }}
                />
              )}
              <div className="relative">
                {step.status.completed ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : step.status.skipped ? (
                  <XCircle className="h-8 w-8 text-amber-500" />
                ) : (
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      currentStep === index + 1
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-gray-300 bg-white text-gray-500",
                    )}
                  >
                    {index + 1}
                  </div>
                )}
              </div>
            </div>
            <span
              className={cn("mt-2 text-xs font-medium", currentStep === index + 1 ? "text-primary" : "text-gray-500")}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
