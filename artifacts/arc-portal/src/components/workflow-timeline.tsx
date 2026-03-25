import React from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, CircleDot } from "lucide-react";

interface WorkflowTimelineProps {
  currentStatus: string;
}

const STAGES = [
  { id: "submitted", label: "Submitted", description: "Request intake" },
  { id: "ea_triage", label: "EA Triage", description: "Scope & Assignment" },
  { id: "specifications_required", label: "Specifications", description: "Technical Details" },
  { id: "arc_scheduled", label: "Scheduled", description: "ARC Session" },
  { id: "arc_review", label: "Review", description: "Committee Review" },
  { id: "approved", label: "Decision", description: "Outcome Recorded" }
];

const STATUS_INDEX_MAP: Record<string, number> = {
  submitted: 0,
  ea_triage: 1,
  specifications_required: 2,
  arc_scheduled: 3,
  arc_review: 4,
  approved: 5,
  approved_with_conditions: 5,
  deferred: 5,
  rejected: 5
};

export function WorkflowTimeline({ currentStatus }: WorkflowTimelineProps) {
  const currentIndex = STATUS_INDEX_MAP[currentStatus] ?? 0;

  return (
    <div className="py-6">
      <div className="flex justify-between relative">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-secondary -z-10 rounded-full"></div>
        
        {/* Active Line Fill */}
        <div 
          className="absolute top-5 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.id} className="flex flex-col items-center w-24 relative group">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-sm",
                isCompleted ? "bg-primary border-primary text-white" : 
                isCurrent ? "bg-white border-primary text-primary shadow-md shadow-primary/20 scale-110" : 
                "bg-card border-secondary text-muted-foreground"
              )}>
                {isCompleted ? <Check className="w-5 h-5" /> : 
                 isCurrent ? <CircleDot className="w-5 h-5 animate-pulse" /> : 
                 <Clock className="w-4 h-4 opacity-50" />}
              </div>
              <div className="mt-3 text-center">
                <div className={cn(
                  "text-xs font-bold font-display transition-colors",
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stage.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
                  {stage.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
