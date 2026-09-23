import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

/** Short, URL-safe primary key. */
const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid());

/** Unix-epoch (seconds) timestamp column defaulting to now. */
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

// ── People ──────────────────────────────────────────────────────────────────
// Individual accounts. In production, identity comes from Cloudflare Access
// (the authenticated email header); in dev it comes from DEV_USER_EMAIL.
export const users = sqliteTable("users", {
  id: pk(),
  email: text("email").notNull().unique(),
  name: text("name"),
  // Per-user accent used for avatars / "who added this".
  color: text("color").notNull().default("#C4653D"),
  createdAt: createdAt(),
});

// ── Lists (groceries, todos, anything) ───────────────────────────────────────
export const lists = sqliteTable("lists", {
  id: pk(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  kind: text("kind").notNull().default("grocery"), // grocery | todo | generic
  createdBy: text("created_by").references(() => users.id),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const listItems = sqliteTable("list_items", {
  id: pk(),
  listId: text("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  qty: text("qty"), // freeform, e.g. "2 lbs", "1 gal"
  note: text("note"),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  addedBy: text("added_by").references(() => users.id),
  source: text("source").notNull().default("manual"), // manual | recipe
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

// ── Recipes ──────────────────────────────────────────────────────────────────
export const recipes = sqliteTable("recipes", {
  id: pk(),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").default(2),
  tags: text("tags"), // JSON-encoded string[]
  createdBy: text("created_by").references(() => users.id),
  createdAt: createdAt(),
});

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: pk(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  qty: real("qty"),
  unit: text("unit"),
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── Pantry (the "do we already have it?" step) ───────────────────────────────
export const pantryItems = sqliteTable("pantry_items", {
  id: pk(),
  name: text("name").notNull(),
  qty: text("qty"),
  unit: text("unit"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ── Chores (self-scheduled + reminders) ──────────────────────────────────────
export const chores = sqliteTable("chores", {
  id: pk(),
  name: text("name").notNull(),
  description: text("description"),
  cadence: text("cadence").notNull().default("weekly"), // daily|weekly|biweekly|monthly|once
  assigneeId: text("assignee_id").references(() => users.id),
  rotation: integer("rotation", { mode: "boolean" }).notNull().default(false),
  scheduledDow: integer("scheduled_dow"), // 0-6 (Sun–Sat), chosen by the assignee
  scheduledTime: text("scheduled_time"), // "HH:MM" local
  lastDoneAt: integer("last_done_at", { mode: "timestamp" }),
  nextDueAt: integer("next_due_at", { mode: "timestamp" }),
  // Last time a reminder/nag was pushed for the current cycle; reset when the
  // chore is completed or its schedule changes. Throttles the overdue nagging.
  lastRemindedAt: integer("last_reminded_at", { mode: "timestamp" }),
  createdBy: text("created_by").references(() => users.id),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const choreCompletions = sqliteTable("chore_completions", {
  id: pk(),
  choreId: text("chore_id")
    .notNull()
    .references(() => chores.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  completedAt: createdAt(),
});

// ── Web Push subscriptions (chore reminders) ─────────────────────────────────
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: pk(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: createdAt(),
});

// ── Meal-planner sessions ────────────────────────────────────────────────────
export const mealPlans = sqliteTable("meal_plans", {
  id: pk(),
  name: text("name"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: createdAt(),
});

export const mealPlanRecipes = sqliteTable("meal_plan_recipes", {
  id: pk(),
  mealPlanId: text("meal_plan_id")
    .notNull()
    .references(() => mealPlans.id, { onDelete: "cascade" }),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  servings: integer("servings"),
});

// ── Relations (enable db.query "with" joins) ─────────────────────────────────
export const listsRelations = relations(lists, ({ many, one }) => ({
  items: many(listItems),
  creator: one(users, { fields: [lists.createdBy], references: [users.id] }),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(lists, { fields: [listItems.listId], references: [lists.id] }),
  addedByUser: one(users, { fields: [listItems.addedBy], references: [users.id] }),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
}));

export const choresRelations = relations(chores, ({ one, many }) => ({
  assignee: one(users, { fields: [chores.assigneeId], references: [users.id] }),
  completions: many(choreCompletions),
}));

// Handy inferred types
export type User = typeof users.$inferSelect;
export type List = typeof lists.$inferSelect;
export type ListItem = typeof listItems.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type Chore = typeof chores.$inferSelect;
