import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const kpiMetricsTable = pgTable("kpi_metrics", {
  id: serial("id").primaryKey(),
  outcomeNumber: integer("outcome_number").notNull(),
  outcomeName: text("outcome_name").notNull(),
  kpiCategory: text("kpi_category").notNull(),
  kpiName: text("kpi_name").notNull(),
  whatToMeasure: text("what_to_measure").notNull(),
  howToMeasure: text("how_to_measure").notNull(),
  currentValue: text("current_value"),
  targetValue: text("target_value"),
  unit: text("unit"),
  status: text("status").notNull().default("not_started"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by"),
});
