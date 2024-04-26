import puppeteer, { Browser } from "puppeteer";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { eq, or, sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { colleges, type College, type InsertCollege } from "@/server/db/schema";
import * as schema from "@/server/db/schema";
import type { Player, InsertPlayer } from "@/server/db/schema";
import { players } from "@/server/db/schema";
import { db } from "@/server/db/";
// make user type in "yes" to confirm deletion
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Are you sure you want to delete all players? Type 'yes' to confirm: ",
  (answer: string) => {
    if (answer !== "yes") {
      console.log("Aborted");
      process.exit(0);
    } else {
      console.log("Deleting all players...");

      // delete all players from db
      db.delete(players).where(sql`1 = 1`);
      console.log("Deleted all players from db");
    }
    rl.close();
    process.exit(0);
  },
);
