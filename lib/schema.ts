import { pgTable, text, timestamp, uuid, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - extends Clerk user data
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Posts table - example feature
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  published: boolean("published").notNull().default(false),
  authorId: uuid("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Post = z.infer<typeof selectPostSchema>;
export type NewPost = z.infer<typeof insertPostSchema>;
