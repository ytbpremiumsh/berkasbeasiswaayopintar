import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-8" />
        
        {/* Progress line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 ease-out mx-8"
          style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 4rem)` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={index} 
              className="relative flex flex-col items-center z-10"
              style={{ flex: 1 }}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                  isCompleted && "bg-success border-success text-white",
                  isCurrent && "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110",
                  !isCompleted && !isCurrent && "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step label */}
              <span
                className={cn(
                  "mt-3 text-xs font-medium text-center max-w-[80px] leading-tight",
                  isCompleted && "text-success",
                  isCurrent && "text-primary font-semibold",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
