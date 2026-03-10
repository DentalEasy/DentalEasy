"use client";

import type { FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function FormField({ label, error, children, className, required }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-danger-500">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-danger-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}
