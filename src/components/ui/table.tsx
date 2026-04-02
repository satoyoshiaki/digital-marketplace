import * as React from "react";

import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />;
}

export function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead {...props} />;
}

export function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("border-b border-border", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground", className)} {...props} />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-4 align-top", className)} {...props} />;
}
