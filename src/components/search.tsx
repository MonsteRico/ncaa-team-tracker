"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./ui/loading-spinner";

export function Search({ className }: { className?: string}) {
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(window.location.search);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.delete("page");
    startTransition(async () => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className={cn("w-full max-w-lg", className)}>
      <Input
        className={cn("w-full", focused && "shadow-sm")}
        placeholder="Search teams..."
        type="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
      />
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
