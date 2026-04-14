import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leanixInitiativesTable = pgTable("leanix_initiatives", {
  id: serial("id").primaryKey(),
  leanixId: text("leanix_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  lifecycle: text("lifecycle"),
  status: text("status").notNull().default("Active"),
  responsible: text("responsible"),
  tags: text("tags").notNull().default("[]"),
  leanixUrl: text("leanix_url"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeanixInitiativeSchema = createInsertSchema(leanixInitiativesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLeanixInitiative = z.infer<typeof insertLeanixInitiativeSchema>;
export type LeanixInitiative = typeof leanixInitiativesTable.$inferSelect;
