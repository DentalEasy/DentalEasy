import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 text-white hover:bg-primary-600 shadow-sm",
        destructive:
          "bg-danger-500 text-white hover:bg-danger-600 shadow-sm",
        outline:
          "border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-xs",
        secondary:
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
        ghost:
          "hover:bg-neutral-100 text-neutral-600",
        link:
          "text-primary-500 underline-offset-4 hover:underline",
        success:
          "bg-success-500 text-white hover:bg-success-600 shadow-sm",
      },
      size: {
        default: "h-9 px-4 rounded-lg",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6",
        icon: "h-9 w-9 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
