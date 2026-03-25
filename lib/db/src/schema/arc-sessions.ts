import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const arcSessionsTable = pgTable("arc_sessions", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull().default(75),
  status: text("status").notNull().default("scheduled"),
  attendees: text("attendees").notNull().default("[]"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArcSessionSchema = createInsertSchema(arcSessionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertArcSession = z.infer<typeof insertArcSessionSchema>;
export type ArcSession = typeof arcSessionsTable.$inferSelect;
