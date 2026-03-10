import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-50 text-primary-700",
        secondary: "border-transparent bg-neutral-100 text-neutral-600",
        destructive: "border-transparent bg-danger-50 text-danger-700",
        outline: "text-neutral-600 border-neutral-200",
        success: "border-transparent bg-success-50 text-success-700",
        warning: "border-transparent bg-warning-50 text-warning-700",
        danger: "border-transparent bg-danger-50 text-danger-700",
        // Payment status
        paid: "border-transparent bg-success-50 text-success-700",
        pending: "border-transparent bg-warning-50 text-warning-700",
        overdue: "border-transparent bg-danger-50 text-danger-700",
        // Appointment status
        confirmed: "border-transparent bg-success-50 text-success-700",
        cancelled: "border-transparent bg-danger-50 text-danger-700",
        completed: "border-transparent bg-primary-50 text-primary-700",
        // Serasa
        "serasa-green": "border-transparent bg-success-50 text-success-700",
        "serasa-yellow": "border-transparent bg-warning-50 text-warning-700",
        "serasa-red": "border-transparent bg-danger-50 text-danger-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
