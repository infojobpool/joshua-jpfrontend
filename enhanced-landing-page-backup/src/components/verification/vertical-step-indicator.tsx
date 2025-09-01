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

interface VerticalStepIndicatorProps {
  currentStep: number
  steps: Step[]
}

export default function VerticalStepIndicator({ currentStep, steps }: VerticalStepIndicatorProps) {
  return (
    <div className="flex flex-col space-y-1">
      {steps.map((step, index) => (
        <div key={index} className="relative">
          <div className="flex items-start space-x-3">
            <div className="flex h-full flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center">
                {step.status.completed ? (
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                ) : step.status.skipped ? (
                  <XCircle className="h-7 w-7 text-amber-500" />
                ) : (
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2",
                      currentStep === index
                        ? "border-blue-800 bg-blue-600 text-primary-foreground"
                        : "border-gray-300 bg-white text-gray-500",
                    )}
                  >
                    {index + 1}
                  </div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn("mt-1 h-10 w-0.5", index < currentStep ? "bg-primary" : "bg-gray-200")} />
              )}
            </div>
            <div className="pt-0.5">
              <p className={cn("font-medium", currentStep === index ? "text-primary" : "text-gray-700")}>{step.name}</p>
              <p className="text-sm text-gray-500">
                {step.status.completed
                  ? "Completed"
                  : step.status.skipped
                    ? "Skipped"
                    : currentStep === index
                      ? "In progress"
                      : "Pending"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
