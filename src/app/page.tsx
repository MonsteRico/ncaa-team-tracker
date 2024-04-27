/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { colleges, type College } from "@/server/db/schema";
import { db } from "@/server/db";
import Fuse from "fuse.js";
import { Search } from "@/components/search";
import Image from "next/image";
import { ThemeToggle } from "../components/theme-toggle";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const search = searchParams?.search as string | undefined;
  const allColleges = await db.select().from(colleges);
  const fuse = new Fuse(allColleges, {
    keys: ["conference", "fullConference", "name", "teamName"],
  });
  const fuseItems = fuse.search(search ?? "");

  const filteredColleges = search
    ? fuseItems.map((item) => item.item)
    : allColleges;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex h-16 shrink-0 items-center border-b px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link className="shrink-0" href="/">
            <Image
              src="/basketball.png"
              alt="A basketball"
              className="h-8 w-8 dark:invert"
              height={24}
              width={24}
            />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">
            NCAA Team Tracker
          </h1>
          <ThemeToggle />
        </div>
        <Search className="ml-auto hidden md:block" />
      </header>
      <Search className="mx-auto block max-w-[90%] pt-4 md:hidden" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filteredColleges.length > 0 ? (
            filteredColleges.map((college) => (
              <CollegeCard college={college} key={college.collegeId} />
            ))
          ) : (
            <p>No colleges found</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline">
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button size="icon" variant="outline">
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">1</span>
            <span>of</span>
            <span>10</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function CollegeCard({ college }: { college: College }) {
  if (college.collegeId == "life") {
    return null;
  }

  return (
    <Link href={`/college/${college.collegeId}`}>
      <div className="flex items-center gap-4 object-fill">
        <img
          alt={`${college.name} logo`}
          className=""
          height={100}
          src={
            college.logo && college.logo != ""
              ? college.logo
              : "/placeholder.svg"
          }
          width={100}
        />
        <div className="grid gap-1">
          <h2 className="font-semibold">{college.name}</h2>
          <p className="text-sm leading-none text-gray-500 dark:text-gray-400">
            {college.fullConference}
          </p>
        </div>
      </div>
    </Link>
  );
}
