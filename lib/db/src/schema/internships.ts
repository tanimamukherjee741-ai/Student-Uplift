import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const internshipListingsTable = pgTable("internship_listings", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("internship"), // internship | part_time | freelance
  payment: integer("payment").notNull().default(0),
  paymentLabel: text("payment_label").notNull().default("per month"),
  location: text("location").notNull(),
  applyLink: text("apply_link"),
  applyEmail: text("apply_email"),
  skills: text("skills"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInternshipListingSchema = createInsertSchema(internshipListingsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInternshipListing = z.infer<typeof insertInternshipListingSchema>;
export type InternshipListing = typeof internshipListingsTable.$inferSelect;
