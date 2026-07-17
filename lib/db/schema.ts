import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const searchItemKind = pgEnum("SearchItemKind", [
  "gmail_message",
  "drive_file",
]);
export const syncStatus = pgEnum("SyncStatus", ["idle", "running", "error"]);

// Value-object mirroring Prisma's generated enum shape (`SearchItemKind.gmail_message`)
// so callers don't need to switch to bare string literals.
export const SearchItemKind = {
  gmail_message: "gmail_message",
  drive_file: "drive_file",
} as const;
export type SearchItemKind =
  (typeof SearchItemKind)[keyof typeof SearchItemKind];

export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const integrations = pgTable(
  "Integration",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    accountEmail: text("accountEmail"),
    accountName: text("accountName"),
    accountAvatar: text("accountAvatar"),
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken"),
    expiresAt: timestamp("expiresAt", { precision: 3 }),
    connectedAt: timestamp("connectedAt", { precision: 3 })
      .notNull()
      .defaultNow(),
    lastSyncedAt: timestamp("lastSyncedAt", { precision: 3 }),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex(
      "Integration_provider_providerAccountId_key",
    ).on(table.provider, table.providerAccountId),
  }),
);

export const searchItems = pgTable(
  "SearchItem",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    integrationId: text("integrationId")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    kind: searchItemKind("kind").notNull(),
    externalId: text("externalId").notNull(),
    title: text("title").notNull(),
    participants: text("participants").notNull(),
    snippet: text("snippet"),
    bodyText: text("bodyText"),
    url: text("url"),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull(),
    metadata: jsonb("metadata").notNull(),
    deletedAt: timestamp("deletedAt", { precision: 3 }),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    syncedAt: timestamp("syncedAt", { precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    integrationExternalUnique: uniqueIndex(
      "SearchItem_integrationId_externalId_key",
    ).on(table.integrationId, table.externalId),
    userIdIdx: index("SearchItem_userId_idx").on(table.userId),
    userUpdatedIdx: index("SearchItem_userId_updatedAt_idx").on(
      table.userId,
      table.updatedAt,
    ),
  }),
);

export const syncCursors = pgTable("SyncCursor", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  integrationId: text("integrationId")
    .notNull()
    .unique()
    .references(() => integrations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  cursor: text("cursor"),
  status: syncStatus("status").notNull().default("idle"),
  lastError: text("lastError"),
  lastSyncedAt: timestamp("lastSyncedAt", { precision: 3 }),
  lastFullSyncAt: timestamp("lastFullSyncAt", { precision: 3 }),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
