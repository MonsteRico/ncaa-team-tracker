import puppeteer, { type Browser } from "puppeteer";
import { eq } from "drizzle-orm";
import { colleges, players, type College } from "@/server/db/schema";
import { db } from "@/server/db";
import { getNewSignees, getRoster, getTransferredPlayers } from "./getPlayers";
import { conferenceAbbrevToFull } from "@/lib/utils";

const erroredColleges: College[] = [];
async function main() {
  const browser = await puppeteer.launch({
    defaultViewport: { height: 1080, width: 1920 },
  });
  
  await insertAllPlayers(browser, "bigten");
  await updateAndAddPlayers(browser, "bigten");

  console.log("Finished inserting/updating players");
  await browser.close();
}

async function insertAllPlayers(browser: Browser, conference?: string) {
  let allColleges = await db.select().from(colleges);
  if (conference) {
    allColleges = allColleges.filter(
      (college) => college.conference === conference,
    );
  }

  if (allColleges.length === 0) {
    console.log("No colleges found for conference:", conference);
    return;
  }

  for (const college of allColleges) {
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
      erroredColleges.push(college);
    }
  }

  // Save errored colleges to a file
  const erroredCollegesFile = Bun.file(
    "src/webscraping/erroredCollegesInserting.json",
  );
  await Bun.write(erroredCollegesFile, JSON.stringify(erroredColleges));
}

async function updateAndAddPlayers(browser: Browser, conference?: string) {
  let allColleges = await db.select().from(colleges);
  if (conference) {
    allColleges = allColleges.filter(
      (college) => college.conference === conference,
    );
  }

  if (allColleges.length === 0) {
    console.log("No colleges found for conference:", conference);
    return;
  }
  for (const college of allColleges) {
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
    } catch (e) {
      console.log("Error for college:", college.name);
      console.error(e);
      erroredColleges.push(college);
    }
  }

  // Save errored colleges to a file
  const erroredCollegesFile = Bun.file(
    "src/webscraping/erroredCollegesUpdating.json",
  );
  await Bun.write(erroredCollegesFile, JSON.stringify(erroredColleges));
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

await main();
process.exit(0);
