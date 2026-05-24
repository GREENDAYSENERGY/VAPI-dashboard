import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(), // bcrypt hash
  createdAt: timestamp("created_at").defaultNow(),
});

export const callNotes = pgTable("call_notes", {
  id: serial("id").primaryKey(),
  callId: text("call_id").unique().notNull(), // VAPI call id
  note: text("note"),
  disposition: text("disposition"), // override label
  createdAt: timestamp("created_at").defaultNow(),
});
