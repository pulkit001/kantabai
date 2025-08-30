import { pgTable, text, timestamp, uuid, boolean, serial, varchar, integer, date, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for kitchen management
export const statusEnum = pgEnum("status", ["Fresh", "Expiring", "Expired"]);
export const actionEnum = pgEnum("action", ["Added", "Updated", "Consumed", "Removed"]);

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

// Kitchens table - users can have multiple kitchens
export const kitchens = pgTable("kitchens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories for organizing items
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // For UI icons
  color: varchar("color", { length: 7 }), // Hex color codes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Kitchen items/ingredients
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  kitchenId: integer("kitchen_id").references(() => kitchens.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  name: varchar("name", { length: 150 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  quantity: integer("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 50 }),
  purchaseDate: date("purchase_date"),
  expiryDate: date("expiry_date"),
  status: statusEnum("status").default("Fresh"),
  location: varchar("location", { length: 100 }), // Where in kitchen (fridge, pantry, etc.)
  notes: text("notes"),
  barcode: varchar("barcode", { length: 50 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Item activity logs
export const itemLogs = pgTable("item_logs", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id, { onDelete: "cascade" }).notNull(),
  action: actionEnum("action").notNull(),
  quantity: integer("quantity"),
  previousQuantity: integer("previous_quantity"),
  notes: text("notes"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  kitchenId: integer("kitchen_id").references(() => kitchens.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  prepTime: integer("prep_time"), // in minutes
  cookTime: integer("cook_time"), // in minutes
  servings: integer("servings"),
  difficulty: varchar("difficulty", { length: 20 }), // Easy, Medium, Hard
  imageUrl: text("image_url"),
  tags: text("tags"), // JSON array of tags
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recipe ingredients
export const recipeItems = pgTable("recipe_items", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  itemName: varchar("item_name", { length: 150 }).notNull(), // Name of ingredient
  categoryId: integer("category_id").references(() => categories.id),
  requiredQuantity: integer("required_quantity").notNull(),
  unit: varchar("unit", { length: 50 }),
  notes: text("notes"), // Optional preparation notes
  isOptional: boolean("is_optional").default(false).notNull(),
}, (table) => ({
  uniqueRecipeItem: unique("unique_recipe_item").on(table.recipeId, table.itemName),
}));

// Shopping lists
export const shoppingLists = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  kitchenId: integer("kitchen_id").references(() => kitchens.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shopping list items
export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  shoppingListId: integer("shopping_list_id").references(() => shoppingLists.id, { onDelete: "cascade" }).notNull(),
  itemName: varchar("item_name", { length: 150 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  quantity: integer("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 50 }),
  estimatedPrice: integer("estimated_price"), // in cents
  isCompleted: boolean("is_completed").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertKitchenSchema = createInsertSchema(kitchens);
export const selectKitchenSchema = createSelectSchema(kitchens);
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertItemSchema = createInsertSchema(items);
export const selectItemSchema = createSelectSchema(items);
export const insertItemLogSchema = createInsertSchema(itemLogs);
export const selectItemLogSchema = createSelectSchema(itemLogs);
export const insertRecipeSchema = createInsertSchema(recipes);
export const selectRecipeSchema = createSelectSchema(recipes);
export const insertRecipeItemSchema = createInsertSchema(recipeItems);
export const selectRecipeItemSchema = createSelectSchema(recipeItems);
export const insertShoppingListSchema = createInsertSchema(shoppingLists);
export const selectShoppingListSchema = createSelectSchema(shoppingLists);
export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems);
export const selectShoppingListItemSchema = createSelectSchema(shoppingListItems);

// Type exports
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Kitchen = z.infer<typeof selectKitchenSchema>;
export type NewKitchen = z.infer<typeof insertKitchenSchema>;
export type Category = z.infer<typeof selectCategorySchema>;
export type NewCategory = z.infer<typeof insertCategorySchema>;
export type Item = z.infer<typeof selectItemSchema>;
export type NewItem = z.infer<typeof insertItemSchema>;
export type ItemLog = z.infer<typeof selectItemLogSchema>;
export type NewItemLog = z.infer<typeof insertItemLogSchema>;
export type Recipe = z.infer<typeof selectRecipeSchema>;
export type NewRecipe = z.infer<typeof insertRecipeSchema>;
export type RecipeItem = z.infer<typeof selectRecipeItemSchema>;
export type NewRecipeItem = z.infer<typeof insertRecipeItemSchema>;
export type ShoppingList = z.infer<typeof selectShoppingListSchema>;
export type NewShoppingList = z.infer<typeof insertShoppingListSchema>;
export type ShoppingListItem = z.infer<typeof selectShoppingListItemSchema>;
export type NewShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
