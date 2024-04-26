/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon } from "lucide-react";
import { Player, colleges, players, type College } from "@/server/db/schema";
import { db } from "@/server/db";
import Fuse from "fuse.js";
import { Search } from "@/components/search";

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";

export default async function TeamPage({
  params,
}: {
  params: { collegeId: string };
}) {
  const { collegeId } = params;
  if (!collegeId) {
    return null;
  }
  const [college] = await db
    .select()
    .from(colleges)
    .where(eq(colleges.collegeId, collegeId));

  const schoolPlayers = await db
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

  const outgoingTransfers = await db
    .select()
    .from(players)
    .where(eq(players.previousCollegeId, collegeId));

  if (!college) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex h-16 shrink-0 items-center border-b px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link className="shrink-0" href="/">
            <FlagIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">
            NCAA Team Tracker
          </h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-center gap-6">
            <img
              alt="Team logo"
              className="rounded-full object-cover"
              height={150}
              src="/placeholder.svg"
              style={{
                aspectRatio: "150/150",
                objectFit: "cover",
              }}
              width={150}
            />
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold">
                {college.teamName ?? college.name}
              </h2>
              <p className="text-sm leading-none text-gray-500 dark:text-gray-400">
                {college.fullConference ?? college.conference}
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Full 2024-25 Roster
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Previous School</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolPlayers.map((player) => (
                    <RosterRow key={player.playerId} player={player} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Incoming Transfers</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Previous School</TableHead>
                    <TableHead>New School</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          alt="Player photo"
                          className="rounded-full object-cover"
                          height={40}
                          src="/placeholder.svg"
                          style={{
                            aspectRatio: "40/40",
                            objectFit: "cover",
                          }}
                          width={40}
                        />
                        <div className="grid gap-1">
                          <span className="font-medium">Dariq Whitehead</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Guard
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Guard</TableCell>
                    <TableCell>Montverde Academy</TableCell>
                    <TableCell>Duke University</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Incoming Signees</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Previous School</TableHead>
                    <TableHead>New School</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          alt="Player photo"
                          className="rounded-full object-cover"
                          height={40}
                          src="/placeholder.svg"
                          style={{
                            aspectRatio: "40/40",
                            objectFit: "cover",
                          }}
                          width={40}
                        />
                        <div className="grid gap-1">
                          <span className="font-medium">Tyrese Proctor</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Guard
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Guard</TableCell>
                    <TableCell>Guildford Young Guns</TableCell>
                    <TableCell>Duke University</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Outgoing Transfers</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Previous School</TableHead>
                    <TableHead>New School</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          alt="Player photo"
                          className="rounded-full object-cover"
                          height={40}
                          src="/placeholder.svg"
                          style={{
                            aspectRatio: "40/40",
                            objectFit: "cover",
                          }}
                          width={40}
                        />
                        <div className="grid gap-1">
                          <span className="font-medium">Jordan Goldwire</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Guard
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Guard</TableCell>
                    <TableCell>Duke University</TableCell>
                    <TableCell>Oklahoma</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RosterRow({ player }: { player: Player }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <img
            alt="Player photo"
            className="h-16 w-16 rounded-full object-cover"
            src={player.image ?? "/placeholder.svg"}
          />
          <div className="grid gap-1">
            <span className="font-medium">{player.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {player.starRating ? `${player.starRating} Star` : "Unknown"}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>{player.position}</TableCell>
      <TableCell>{player.previousCollegeId}</TableCell>
    </TableRow>
  );
}
