"use client";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {  usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function TeamPageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const [_, startTransition] = useTransition();
  const allParams = useSearchParams();

  const handleFilter = (filter?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (filter) {
      params.set("filter", filter);
    } else {
      params.delete("filter");
    }
    startTransition(async () => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => {
          handleFilter();
        }}
        size="sm"
        variant="outline"
        className={cn(allParams.get("filter") == null && "bg-muted")}
      >
        All Players
      </Button>
      <Button
        onClick={() => handleFilter("signees")}
        size="sm"
        variant="outline"
        className={cn(allParams.get("filter") == "signees" && "bg-muted")}
      >
        New Signees
      </Button>
      <Button
        onClick={() => handleFilter("transfers")}
        size="sm"
        variant="outline"
        className={cn(allParams.get("filter") == "transfers" && "bg-muted")}
      >
        Incoming Transfers
      </Button>
    </div>
  );
}
