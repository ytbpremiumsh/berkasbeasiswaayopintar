import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                    isCompleted && "bg-success text-success-foreground",
                    isCurrent && "bg-primary text-primary-foreground shadow-glow",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center hidden sm:block max-w-[80px]",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      isCompleted ? "bg-success w-full" : "bg-transparent w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
