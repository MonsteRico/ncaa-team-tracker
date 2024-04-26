import { eq } from "drizzle-orm";
import { colleges } from "@/server/db/schema";
import { db } from "@/server/db";

interface School {
  name: string;
  id: string;
  logo?: string;
}

type Conferences = Record<string, School[]>;

const conferencesFile = Bun.file("src/webscraping/conferences.json");
const conferences = (await conferencesFile.json()) as Conferences;
if (!conferences) {
  console.log("Conferences file not found");
  process.exit(0);
}
for (const conference in conferences) {
  // @ts-expect-error idk
  for (const school of conferences[conference]) {
    const college = await db
      .select({
        collegeId: colleges.collegeId,
      })
      .from(colleges)
      .where(eq(colleges.collegeId, school.id));
    if (college.length === 0) {
      console.log("Inserting College:", school.name);
      const insert = school;
      await db.insert(colleges).values({
        collegeId: insert.id,
        name: insert.name,
        logo: insert.logo,
        conference: conference,
      });
    }
  }
}

process.exit(0);
