import puppeteer, { type Browser } from "puppeteer";
import { eq, or } from "drizzle-orm";
import { colleges, players, type College } from "@/server/db/schema";
import { db } from "@/server/db";
import { getNewSignees, getRoster, getTransferredPlayers } from "./getPlayers";
import { conferenceAbbrevToFull } from "@/lib/utils";

export async function insertPlayers({
  browser,
  passInCollege,
}: {
  browser?: Browser;
  passInCollege: College | string;
}) {
  if (!browser) {
    browser = await puppeteer.launch();
  }
  let college: College | undefined;
  if (typeof passInCollege === "string") {
    college = await db.query.colleges.findFirst({
      where: eq(colleges.collegeId, passInCollege),
    });
  } else {
    college = passInCollege;
  }

  if (!college) {
    console.log("College not found");
    return;
  }

  console.log("Inserting players for college:", college.name);
  try {
    const roster = await getRoster(college, browser);
    const newSignees = await getNewSignees(college, browser);
    const transferredPlayers = await getTransferredPlayers(college, browser);

    const allPlayers = [...roster, ...newSignees, ...transferredPlayers];
    for (const player of allPlayers) {
      const existingPlayer = await db.query.players.findFirst({
        where: eq(players.playerId, player.playerId),
      });
      if (!existingPlayer) {
        console.log("Inserting player:", player.name, "for", college.name);
        await db.insert(players).values(player);
      } else {
        console.log("Player already exists. Updating:", player.name);
        await db
          .update(players)
          .set(player)
          .where(eq(players.playerId, player.playerId));
      }
    }
  } catch (e) {
    console.log("Error for college:", college.name);
    console.error(e);
  }
}

export async function updateAndAddPlayers(
{browser, passInCollege}: {
    browser?: Browser;
    passInCollege: College | string;
}
) {
    if (!browser) {
        browser = await puppeteer.launch();
    }
  let college: College | undefined;
  if (typeof passInCollege === "string") {
    college = await db.query.colleges.findFirst({
      where: eq(colleges.collegeId, passInCollege),
    });
  } else {
    college = passInCollege;
  }

  if (!college) {
    console.log("College not found");
    return;
  }

  console.log("Updating players for college:", college.name);
  try {
    const newSignees = await getNewSignees(college, browser);
    const transferredPlayers = await getTransferredPlayers(college, browser);

    const allPlayers = [...newSignees, ...transferredPlayers];
    for (const player of allPlayers) {
      const existingPlayer = await db.query.players.findFirst({
        where: eq(players.playerId, player.playerId),
      });
      if (!existingPlayer) {
        console.log("Inserting player:", player.name, "for", college.name);
        await db.insert(players).values(player);
      } else {
        // check if anything has changed
        player.id = existingPlayer.id;
        if (!deepEqual(existingPlayer, player)) {
          console.log("Player already exists. Updating:", player.name);
          await db
            .update(players)
            .set(player)
            .where(eq(players.playerId, player.playerId));
        } else {
          console.log("Player already exists. No changes:", player.name);
        }
      }
    }
    await db
      .update(colleges)
      .set({ lastUpdate: new Date().toISOString() })
      .where(eq(colleges.collegeId, college.collegeId));
  } catch (e) {
    console.log("Error for college:", college.name);
    console.error(e);
  }
}

function deepEqual(x: object, y: object): boolean {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        // @ts-expect-error isk
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}

