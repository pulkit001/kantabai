/**
 * Database utilities for the Kantabai kitchen management application
 * 
 * This module provides all database operations for:
 * - User management (Clerk integration)
 * - Kitchen management (multi-kitchen support with defaults)
 * - Item/Ingredient tracking (with expiry dates and categories)
 * - Category management
 * - Item logging and history
 */

import { db } from "./db";
import { 
  users, 
  kitchens, 
  categories, 
  items, 
  itemLogs
} from "./schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import type { 
  User, NewUser, 
  Kitchen, NewKitchen,
  Item, NewItem,
  Category, NewCategory,
  ItemLog, NewItemLog
} from "./schema";

// ============================================================================
// USER OPERATIONS
// ============================================================================
export async function createUser(userData: NewUser): Promise<User> {
  try {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return user || null;
  } catch (error) {
    console.error("Error getting user by Clerk ID:", error);
    throw error;
  }
}

/**
 * Creates a user if they don't already exist in the database
 * Used for Clerk authentication integration
 */


export async function createUserIfNotExists(userData: {
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
}): Promise<User> {
  try {
    // First check if user exists
    const existingUser = await getUserByClerkId(userData.clerkId);
    if (existingUser) {
      return existingUser;
    }

    // Create new user if doesn't exist
    const [newUser] = await db.insert(users).values({
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImage: userData.profileImage,
    }).returning();
    
    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(clerkId: string, userData: Partial<NewUser>): Promise<User | null> {
  try {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
      .returning();
    return user || null;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(clerkId: string): Promise<void> {
  try {
    await db.delete(users).where(eq(users.clerkId, clerkId));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// ============================================================================
// KITCHEN OPERATIONS
// ============================================================================
/**
 * Creates a new kitchen and handles default kitchen logic
 * Automatically unsets other default kitchens for the user if this one is set as default
 */
export async function createKitchen(kitchenData: NewKitchen): Promise<Kitchen> {
  try {
    // If this kitchen is being set as default, unset other defaults for this user
    if (kitchenData.isDefault) {
      await db
        .update(kitchens)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(kitchens.userId, kitchenData.userId), eq(kitchens.isDefault, true)));
    }
    
    const [kitchen] = await db.insert(kitchens).values(kitchenData).returning();
    return kitchen;
  } catch (error) {
    console.error("Error creating kitchen:", error);
    throw error;
  }
}

export async function getKitchensByUser(userId: string): Promise<Kitchen[]> {
  try {
    const userKitchens = await db.select().from(kitchens).where(eq(kitchens.userId, userId));
    return userKitchens;
  } catch (error) {
    console.error("Error getting kitchens by user:", error);
    throw error;
  }
}

export async function fixMultipleDefaults(userId: string): Promise<void> {
  try {
    // Get all kitchens for this user
    const userKitchens = await getKitchensByUser(userId);
    const defaultKitchens = userKitchens.filter(k => k.isDefault);
    
    // If there are multiple defaults, keep only the oldest one as default
    if (defaultKitchens.length > 1) {
      // Sort by creation date and keep the first one
      const sortedDefaults = defaultKitchens.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const keepDefault = sortedDefaults[0];
      const removeDefaults = sortedDefaults.slice(1);
      
      // Update all other defaults to false
      for (const kitchen of removeDefaults) {
        await db
          .update(kitchens)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(kitchens.id, kitchen.id));
      }
      
      console.log(`Fixed multiple defaults for user ${userId}. Kept kitchen ${keepDefault.id} as default.`);
    }
    
    // If no defaults exist and user has kitchens, make the oldest one default
    if (defaultKitchens.length === 0 && userKitchens.length > 0) {
      const oldestKitchen = userKitchens.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
      
      await db
        .update(kitchens)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(kitchens.id, oldestKitchen.id));
        
      console.log(`Set kitchen ${oldestKitchen.id} as default for user ${userId}.`);
    }
  } catch (error) {
    console.error("Error fixing multiple defaults:", error);
    throw error;
  }
}

export async function getDefaultKitchen(userId: string): Promise<Kitchen | null> {
  try {
    const [defaultKitchen] = await db
      .select()
      .from(kitchens)
      .where(and(eq(kitchens.userId, userId), eq(kitchens.isDefault, true)));
    return defaultKitchen || null;
  } catch (error) {
    console.error("Error getting default kitchen:", error);
    throw error;
  }
}

export async function setDefaultKitchen(kitchenId: number, userId: string): Promise<Kitchen> {
  try {
    // First, unset all other defaults for this user
    await db
      .update(kitchens)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(kitchens.userId, userId), eq(kitchens.isDefault, true)));
    
    // Set the specified kitchen as default
    const [updatedKitchen] = await db
      .update(kitchens)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(kitchens.id, kitchenId), eq(kitchens.userId, userId)))
      .returning();
    
    if (!updatedKitchen) {
      throw new Error("Kitchen not found or not owned by user");
    }
    
    return updatedKitchen;
  } catch (error) {
    console.error("Error setting default kitchen:", error);
    throw error;
  }
}

// ============================================================================
// ITEM/INGREDIENT OPERATIONS
// ============================================================================
export async function getItemsByKitchen(kitchenId: number) {
  try {
    const kitchenItems = await db
      .select({
        id: items.id,
        name: items.name,
        brand: items.brand,
        quantity: items.quantity,
        unit: items.unit,
        status: items.status,
        expiryDate: items.expiryDate,
        location: items.location,
        notes: items.notes,
        category: categories.name,
        categoryColor: categories.color,
        createdAt: items.createdAt,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.kitchenId, kitchenId))
      .orderBy(desc(items.createdAt));
    return kitchenItems;
  } catch (error) {
    console.error("Error getting items by kitchen:", error);
    throw error;
  }
}

export async function getExpiringItems(kitchenId: number, days: number = 7) {
  try {
    const expiringItems = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.kitchenId, kitchenId),
          sql`${items.expiryDate} > current_date`,
          sql`${items.expiryDate} <= current_date + interval ${sql.raw(`'${days} days'`)}`
        )
      )
      .orderBy(items.expiryDate);
    return expiringItems;
  } catch (error) {
    console.error("Error getting expiring items:", error);
    throw error;
  }
}

/**
 * Gets items expiring this month but NOT this week (8-30 days from now)
 * Used to separate weekly vs monthly expiry tracking
 */
export async function getExpiringItemsThisMonth(kitchenId: number) {
  try {
    // Get items expiring within 30 days but NOT within 7 days (this month but not this week)
    const expiringItems = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.kitchenId, kitchenId),
          sql`${items.expiryDate} > current_date + interval ${sql.raw("'7 days'")}`,
          sql`${items.expiryDate} <= current_date + interval ${sql.raw("'30 days'")}`
        )
      )
      .orderBy(items.expiryDate);
    return expiringItems;
  } catch (error) {
    console.error("Error getting expiring items this month:", error);
    throw error;
  }
}

export async function createItem(itemData: NewItem): Promise<Item> {
  try {
    const [item] = await db.insert(items).values(itemData).returning();
    
    // Log the action
    await createItemLog({
      itemId: item.id,
      action: "Added",
      quantity: item.quantity,
    });
    
    return item;
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
}

export async function updateItemQuantity(itemId: number, newQuantity: number, userId?: string): Promise<Item | null> {
  try {
    // Get current item
    const [currentItem] = await db.select().from(items).where(eq(items.id, itemId));
    if (!currentItem) throw new Error("Item not found");

    // Update quantity
    const [updatedItem] = await db
      .update(items)
      .set({ 
        quantity: newQuantity, 
        updatedAt: new Date(),
        status: newQuantity === 0 ? "Expired" : currentItem.status 
      })
      .where(eq(items.id, itemId))
      .returning();

    // Log the action
    await createItemLog({
      itemId,
      action: newQuantity < currentItem.quantity ? "Consumed" : "Updated",
      quantity: newQuantity,
      previousQuantity: currentItem.quantity,
      userId,
    });

    return updatedItem || null;
  } catch (error) {
    console.error("Error updating item quantity:", error);
    throw error;
  }
}

export async function updateItem(itemId: number, itemData: Partial<NewItem>, userId?: string): Promise<Item | null> {
  try {
    // Get current item for logging
    const [currentItem] = await db.select().from(items).where(eq(items.id, itemId));
    if (!currentItem) throw new Error("Item not found");

    // Update the item
    const [updatedItem] = await db
      .update(items)
      .set({ 
        ...itemData,
        updatedAt: new Date()
      })
      .where(eq(items.id, itemId))
      .returning();

    // Log the action
    await createItemLog({
      itemId,
      action: "Updated",
      quantity: updatedItem.quantity,
      previousQuantity: currentItem.quantity,
      userId,
    });

    return updatedItem || null;
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
}

export async function deleteItem(itemId: number, userId?: string): Promise<void> {
  try {
    // Get current item for logging
    const [currentItem] = await db.select().from(items).where(eq(items.id, itemId));
    if (!currentItem) throw new Error("Item not found");

    // Log the removal action
    await createItemLog({
      itemId,
      action: "Removed",
      quantity: 0,
      previousQuantity: currentItem.quantity,
      userId,
    });

    // Delete the item
    await db.delete(items).where(eq(items.id, itemId));
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
}

// ============================================================================
// ITEM LOGGING & HISTORY
// ============================================================================
export async function createItemLog(logData: NewItemLog): Promise<ItemLog> {
  try {
    const [log] = await db.insert(itemLogs).values(logData).returning();
    return log;
  } catch (error) {
    console.error("Error creating item log:", error);
    throw error;
  }
}

export async function getItemHistory(itemId: number): Promise<ItemLog[]> {
  try {
    const history = await db
      .select()
      .from(itemLogs)
      .where(eq(itemLogs.itemId, itemId))
      .orderBy(desc(itemLogs.createdAt));
    return history;
  } catch (error) {
    console.error("Error getting item history:", error);
    throw error;
  }
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================
export async function getAllCategories(): Promise<Category[]> {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    return allCategories;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
}

export async function createCategory(categoryData: NewCategory): Promise<Category> {
  try {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

// ============================================================================
// KITCHEN STATISTICS & ANALYTICS
// ============================================================================
export async function getKitchenStats(kitchenId: number) {
  try {
    const [stats] = await db
      .select({
        totalItems: count(items.id),
        expiringCount: count(sql`CASE WHEN ${items.expiryDate} > current_date AND ${items.expiryDate} <= current_date + interval ${sql.raw("'7 days'")} THEN 1 END`),
        expiredCount: count(sql`CASE WHEN ${items.status} = 'Expired' OR ${items.expiryDate} <= current_date THEN 1 END`),
      })
      .from(items)
      .where(eq(items.kitchenId, kitchenId));

    return stats || { totalItems: 0, expiringCount: 0, expiredCount: 0 };
  } catch (error) {
    console.error("Error getting kitchen stats:", error);
    throw error;
  }
}

