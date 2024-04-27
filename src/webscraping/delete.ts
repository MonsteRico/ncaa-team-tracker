import { sql } from "drizzle-orm";
import { players } from "@/server/db/schema";
import { db } from "@/server/db/";
// make user type in "yes" to confirm deletion
import readline from "readline";
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
      void db.delete(players).where(sql`1 = 1`);
      console.log("Deleted all players from db");
    }
    rl.close();
    process.exit(0);
  },
);
