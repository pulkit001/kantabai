import { db } from "./db";
import { users, posts } from "./schema";
import { eq, desc } from "drizzle-orm";
import type { User, NewUser, Post, NewPost } from "./schema";

// User functions
export async function createUser(user: NewUser): Promise<User> {
  const [newUser] = await db.insert(users).values(user).returning();
  return newUser;
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
  return user || null;
}

export async function updateUser(clerkId: string, updates: Partial<NewUser>): Promise<User | null> {
  const [updatedUser] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))
    .returning();
  return updatedUser || null;
}

export async function deleteUser(clerkId: string): Promise<void> {
  await db.delete(users).where(eq(users.clerkId, clerkId));
}

// Post functions
export async function createPost(post: NewPost): Promise<Post> {
  const [newPost] = await db.insert(posts).values(post).returning();
  return newPost;
}

export async function getPostsByUser(authorId: string): Promise<Post[]> {
  return await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, authorId))
    .orderBy(desc(posts.createdAt));
}

export async function getPublishedPosts(): Promise<Post[]> {
  return await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));
}

export async function getPostById(id: number): Promise<Post | null> {
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  return post || null;
}

export async function updatePost(id: number, updates: Partial<NewPost>): Promise<Post | null> {
  const [updatedPost] = await db
    .update(posts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();
  return updatedPost || null;
}

export async function deletePost(id: number): Promise<void> {
  await db.delete(posts).where(eq(posts.id, id));
}
