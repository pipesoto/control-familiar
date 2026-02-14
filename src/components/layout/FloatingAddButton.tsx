"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingAddButtonProps {
  href?: string;
  className?: string;
  "aria-label"?: string;
}

export function FloatingAddButton({
  href = "/registro/nuevo",
  className,
  "aria-label": ariaLabel = "Agregar registro",
}: FloatingAddButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-label={ariaLabel}
    >
      <Plus className="h-7 w-7" aria-hidden />
    </Link>
  );
}
