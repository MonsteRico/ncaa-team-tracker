/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Dot, GraduationCap, StarIcon } from "lucide-react";
import { type Player, colleges, players } from "@/server/db/schema";
import { db } from "@/server/db";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { cn, playerPositionToFull } from "@/lib/utils";
import { TeamPageFilters } from "@/components/team-page-filters";
import Image from "next/image";
import {
  TooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { updateAndAddPlayers } from "@/webscraping/insertAddCollege";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: { collegeId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { collegeId } = params;
  if (!collegeId) {
    return null;
  }
  const [college] = await db
    .select()
    .from(colleges)
    .where(eq(colleges.collegeId, collegeId));

  if (!college) {
    return null;
  }

  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.currentCollegeId, collegeId));

  const incomingTransfers = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.newCollegeId, collegeId),
        isNotNull(players.previousCollegeId),
      ),
    );

  const incomingSignees = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.newCollegeId, collegeId),
        isNull(players.previousCollegeId),
      ),
    );

  let filteredPlayers: Player[];
  if (searchParams?.filter === "transfers") {
    filteredPlayers = incomingTransfers;
  } else if (searchParams?.filter === "signees") {
    filteredPlayers = incomingSignees;
  } else {
    filteredPlayers = allPlayers;
  }

  // move players that dont have a player page to the end, and then players without an image to the end. so it goes players with player page and image, players with player page and no image, players without player page and image, players without player page and no image
  filteredPlayers.sort((a, b) => {
    if (a.playerPage && b.playerPage) {
      if (a.image && b.image) {
        return 0;
      }
      if (a.image) {
        return -1;
      }
      return 1;
    }
    if (a.playerPage) {
      return -1;
    }
    if (b.playerPage) {
      return 1;
    }
    return 0;
  });

  const outgoingTransfers = await db
    .select()
    .from(players)
    .where(eq(players.previousCollegeId, collegeId));

  if (!college) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
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
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-5">
              <img
                alt={`${college.name} logo`}
                className="h-32 w-32"
                src={
                  college.logo && college.logo != ""
                    ? college.logo
                    : "/placeholder.svg"
                }
              />
              <div>
                <h1 className="text-3xl font-bold">{college.name}</h1>
                {college.teamName && <p className="text-muted-foreground">
                  {college.teamName}
                </p>}
                <p className="text-muted-foreground">
                  {college.fullConference ?? college.conference}
                </p>
              </div>
            </div>
            <h1 className="text-3xl font-bold">Roster</h1>
          </div>
          <div className="space-y-4">
            <TeamPageFilters />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredPlayers.map((player) => (
                <LinkedPlayerCard
                  key={player.playerId}
                  player={player}
                  pageCollegeId={collegeId}
                />
              ))}
            </div>
          </div>
        </div>
        {outgoingTransfers.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Outgoing Players</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Players who have left the team.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {outgoingTransfers.map((player) => (
                <LinkedPlayerCard
                  key={player.playerId}
                  player={player}
                  pageCollegeId={collegeId}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LinkedPlayerCard({
  player,
  pageCollegeId,
}: {
  player: Player;
  pageCollegeId: string;
}) {
  if (!player.playerPage) {
    return <PlayerCard player={player} pageCollegeId={pageCollegeId} />;
  }

  return (
    <Link href={player.playerPage}>
      <PlayerCard player={player} pageCollegeId={pageCollegeId} />
    </Link>
  );
}

function PlayerCard({
  player,
  pageCollegeId,
}: {
  player: Player;
  pageCollegeId: string;
}) {
  return (
    <div
      className={cn(
        "m-1 flex items-center space-x-3 rounded-sm p-2 transition",
        player.playerPage && "hover:bg-muted",
      )}
    >
      <img
        alt={player.name + " photo"}
        className="h-24 w-24 rounded-full object-cover object-top"
        height="80"
        src={player.image ?? "/player-placeholder.jpg"}
        width="80"
      />
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="font-semibold">{player.name}</div>
          <Dot className="hidden h-4 w-4 fill-muted sm:block" />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {playerPositionToFull(player.position)}
          </div>
        </div>

        {player.starRating !== 0 && player.starRating && (
          <div className="flex items-center space-x-1">
            <div className="flex">
              {Array.from({ length: player.starRating }).map((_, i) => (
                <StarIcon key={i} className="h-3 w-3 fill-primary" />
              ))}
              {Array.from({ length: 5 - player.starRating }).map((_, i) => (
                <StarIcon
                  key={i}
                  className="stroke-muted-contrast h-3 w-3 fill-muted"
                />
              ))}
            </div>
            {player.nationalRating && (
              <p className="text-sm text-muted-foreground">
                Natl. {player.nationalRating}
              </p>
            )}
          </div>
        )}
        {player.previousCollegeId &&
          (player.status == "Committed" || player.status == "Draft") &&
          player.newCollegeId == pageCollegeId && (
            <div className="flex flex-row items-center space-x-2">
              <p>Previously at</p>
              <CollegeIcon collegeId={player.previousCollegeId} />
            </div>
          )}
        {player.previousCollegeId && player.status == "Entered" && (
          <div className="flex flex-row items-center space-x-2">
            Entered transfer portal
          </div>
        )}
        {player.previousCollegeId &&
          player.status != "Entered" &&
          player.newCollegeId != pageCollegeId &&
          player.newCollegeId && (
            <div className="flex flex-row items-center space-x-2">
              <CollegeIcon collegeId={player.previousCollegeId} />
              <ArrowRight className="h-4 w-4" />
              <CollegeIcon collegeId={player.newCollegeId} />
            </div>
          )}
        {player.highSchool && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            HS: {player.highSchool}
          </div>
        )}
      </div>
    </div>
  );
}

async function CollegeIcon({ collegeId }: { collegeId: string }) {
  const [college] = await db
    .select()
    .from(colleges)
    .where(eq(colleges.collegeId, collegeId));
  if (!college) {
    return null;
  }

  if (collegeId == "life") {
    return (
      <div className="flex flex-row items-center space-x-2">
        <GraduationCap className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">(Graduated)</p>
      </div>
    );
  }

  if (collegeId == "nba") {
    return (
      <Link href={`/college/${collegeId}`}>
        <img
          alt={`${college.name} logo`}
          className="h-8 w-6"
          src={
            college.logo && college.logo != ""
              ? college.logo
              : "/placeholder.svg"
          }
        />
      </Link>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/college/${collegeId}`}>
            <img
              alt={`${college.name} logo`}
              className="h-8 w-8"
              src={
                college.logo && college.logo != ""
                  ? college.logo
                  : "/placeholder.svg"
              }
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{college.teamName ?? college.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
