import { pgTable, text, serial, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reward: integer("reward").notNull().default(0),
  bonusReward: integer("bonus_reward").notNull().default(0),
  points: integer("points").notNull().default(20),
  bonusPoints: integer("bonus_points").notNull().default(10),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userChallengesTable = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;
