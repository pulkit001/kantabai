import { db } from "./db";
import { 
  users, 
  kitchens, 
  categories, 
  items, 
  itemLogs, 
  recipes, 
  recipeItems,
  shoppingLists,
  shoppingListItems 
} from "./schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import type { 
  User, NewUser, 
  Kitchen, NewKitchen,
  Item, NewItem,
  Category, NewCategory,
  Recipe, NewRecipe,
  ItemLog, NewItemLog
} from "./schema";

// User operations
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

// Kitchen operations
export async function createKitchen(kitchenData: NewKitchen): Promise<Kitchen> {
  try {
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

// Item operations
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
          sql`${items.expiryDate} <= current_date + interval '${days} days'`
        )
      )
      .orderBy(items.expiryDate);
    return expiringItems;
  } catch (error) {
    console.error("Error getting expiring items:", error);
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

// Item log operations
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

// Category operations
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

// Recipe operations
export async function getRecipesByKitchen(kitchenId: number): Promise<Recipe[]> {
  try {
    const kitchenRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.kitchenId, kitchenId))
      .orderBy(desc(recipes.createdAt));
    return kitchenRecipes;
  } catch (error) {
    console.error("Error getting recipes by kitchen:", error);
    throw error;
  }
}

export async function getRecipeWithIngredients(recipeId: number) {
  try {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
    if (!recipe) return null;

    const ingredients = await db
      .select({
        id: recipeItems.id,
        itemName: recipeItems.itemName,
        requiredQuantity: recipeItems.requiredQuantity,
        unit: recipeItems.unit,
        notes: recipeItems.notes,
        isOptional: recipeItems.isOptional,
        category: categories.name,
      })
      .from(recipeItems)
      .leftJoin(categories, eq(recipeItems.categoryId, categories.id))
      .where(eq(recipeItems.recipeId, recipeId));

    return { ...recipe, ingredients };
  } catch (error) {
    console.error("Error getting recipe with ingredients:", error);
    throw error;
  }
}

// Kitchen stats
export async function getKitchenStats(kitchenId: number) {
  try {
    const [stats] = await db
      .select({
        totalItems: count(items.id),
        expiringCount: count(sql`CASE WHEN ${items.expiryDate} <= current_date + interval '7 days' THEN 1 END`),
        expiredCount: count(sql`CASE WHEN ${items.status} = 'Expired' THEN 1 END`),
      })
      .from(items)
      .where(eq(items.kitchenId, kitchenId));

    return stats || { totalItems: 0, expiringCount: 0, expiredCount: 0 };
  } catch (error) {
    console.error("Error getting kitchen stats:", error);
    throw error;
  }
}

// Legacy post functions (for compatibility with existing dashboard)
export async function getPostsByUser(userId: string) {
  try {
    // Return empty array since we're transitioning away from posts
    return [];
  } catch (error) {
    console.error("Error getting posts by user:", error);
    return [];
  }
}