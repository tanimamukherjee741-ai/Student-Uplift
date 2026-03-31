import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tutorListingsTable = pgTable("tutor_listings", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  fees: integer("fees").notNull().default(0),
  feesLabel: text("fees_label").notNull().default("per month"),
  city: text("city").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  mode: text("mode").notNull().default("both"), // online | offline | both
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTutorListingSchema = createInsertSchema(tutorListingsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTutorListing = z.infer<typeof insertTutorListingSchema>;
export type TutorListing = typeof tutorListingsTable.$inferSelect;
