import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ==========================================
// CARD
// ==========================================
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5 border-b border-border/40 bg-card/50", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold font-display text-foreground", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props}>{children}</div>;
}

// ==========================================
// BUTTON
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  href?: string;
}

export function Button({ variant = "primary", size = "md", className, href, children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  
  const variants = {
    primary: "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border-2 border-border bg-transparent hover:border-primary/50 hover:bg-primary/5 text-foreground",
    ghost: "bg-transparent hover:bg-secondary text-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  };
  
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
    icon: "p-2",
  };

  const classes = cn(baseStyles, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

// ==========================================
// BADGES
// ==========================================
export function Badge({ className, variant = "default", children }: { className?: string, variant?: string, children: React.ReactNode }) {
  const variants: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
    purple: "bg-purple-100 text-purple-800 border border-purple-200",
  };
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider", variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const mapping: Record<string, { label: string, variant: string }> = {
    submitted: { label: "Submitted", variant: "default" },
    ea_triage: { label: "EA Triage", variant: "primary" },
    specifications_required: { label: "Specs Required", variant: "warning" },
    arc_scheduled: { label: "ARC Scheduled", variant: "purple" },
    arc_review: { label: "ARC Review", variant: "primary" },
    approved: { label: "Approved", variant: "success" },
    approved_with_conditions: { label: "Approved (Conditions)", variant: "success" },
    deferred: { label: "Deferred", variant: "warning" },
    rejected: { label: "Rejected", variant: "danger" },
  };

  const config = mapping[status] || { label: status, variant: "default" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const mapping: Record<string, string> = {
    low: "default",
    medium: "primary",
    high: "warning",
    critical: "danger",
  };
  return <Badge variant={mapping[priority] || "default"}>{priority.toUpperCase()}</Badge>;
}

// ==========================================
// FORM INPUTS
// ==========================================
export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-semibold text-foreground mb-1.5", className)} {...props}>{children}</label>;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn("flex w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all", className)}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn("flex min-h-[100px] w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y", className)}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn("flex w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none cursor-pointer", className)}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
