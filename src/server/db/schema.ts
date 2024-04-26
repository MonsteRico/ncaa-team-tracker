// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import {
  pgTableCreator,
  serial,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `ncaa-team-tracker_${name}`,
);

export const colleges = createTable("colleges", {
  id: serial("id").primaryKey(),
  collegeId: varchar("collegeId").notNull(),
  name: varchar("name").notNull(),
  logo: varchar("logo"),
  conference: varchar("conference").notNull(),
  fullConference: varchar("fullConference"),
  teamName: varchar("teamName"),
});


export type College = typeof colleges.$inferSelect;
export type InsertCollege = typeof colleges.$inferInsert;

export const players = createTable("players", {
  id: serial("id").primaryKey(),
  playerId: varchar("playerId").notNull(),
  name: varchar("name").notNull().default("Unknown"),
  image: varchar("image"),
  position: varchar("position"),
  status: varchar("status"),
  starRating: integer("starRating"),
  nationalRating: integer("nationalRating"),
  previousCollegeId: varchar("previousCollegeId"),
  currentCollegeId: varchar("collegeId"),
  newCollegeId: varchar("newCollegeId"),
  playerPage: varchar("playerPage"),
  highSchool: varchar("highSchool"),
});

export const playersRelations = relations(players, ({ one }) => ({
  currentCollege: one(colleges, {
    fields: [players.currentCollegeId],
    references: [colleges.collegeId],
  }),
  newCollege: one(colleges, {
    fields: [players.newCollegeId],
    references: [colleges.collegeId],
  }),
  previousCollege: one(colleges, {
    fields: [players.previousCollegeId],
    references: [colleges.collegeId],
  }),
}));

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;
