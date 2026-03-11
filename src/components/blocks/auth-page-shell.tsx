import * as React from "react";

import { cn } from "@/lib/utils";

interface AuthPageShellProps {
  backgroundClassName: string;
  gridClassName?: string;
  children: React.ReactNode;
}

export function AuthPageShell({
  backgroundClassName,
  gridClassName,
  children,
}: AuthPageShellProps) {
  return (
    <main className={cn("min-h-screen px-6 py-10", backgroundClassName)}>
      <div
        className={cn(
          "mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10",
          gridClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
