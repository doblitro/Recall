CREATE TYPE "public"."SearchItemKind" AS ENUM('gmail_message', 'drive_file');--> statement-breakpoint
CREATE TYPE "public"."SyncStatus" AS ENUM('idle', 'running', 'error');--> statement-breakpoint
CREATE TABLE "Integration" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"accountEmail" text,
	"accountName" text,
	"accountAvatar" text,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"expiresAt" timestamp (3),
	"connectedAt" timestamp (3) DEFAULT now() NOT NULL,
	"lastSyncedAt" timestamp (3),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SearchItem" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"integrationId" text NOT NULL,
	"provider" text NOT NULL,
	"kind" "SearchItemKind" NOT NULL,
	"externalId" text NOT NULL,
	"title" text NOT NULL,
	"participants" text NOT NULL,
	"snippet" text,
	"bodyText" text,
	"url" text,
	"updatedAt" timestamp (3) NOT NULL,
	"metadata" jsonb NOT NULL,
	"deletedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"syncedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SyncCursor" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integrationId" text NOT NULL,
	"provider" text NOT NULL,
	"cursor" text,
	"status" "SyncStatus" DEFAULT 'idle' NOT NULL,
	"lastError" text,
	"lastSyncedAt" timestamp (3),
	"lastFullSyncAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "SyncCursor_integrationId_unique" UNIQUE("integrationId")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SearchItem" ADD CONSTRAINT "SearchItem_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SearchItem" ADD CONSTRAINT "SearchItem_integrationId_Integration_id_fk" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_integrationId_Integration_id_fk" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Integration_provider_providerAccountId_key" ON "Integration" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE UNIQUE INDEX "SearchItem_integrationId_externalId_key" ON "SearchItem" USING btree ("integrationId","externalId");--> statement-breakpoint
CREATE INDEX "SearchItem_userId_idx" ON "SearchItem" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "SearchItem_userId_updatedAt_idx" ON "SearchItem" USING btree ("userId","updatedAt");--> statement-breakpoint
-- This baseline migration documents the schema already live on the database
-- (originally created via Prisma migrations before the Drizzle swap) — it is
-- marked as already-applied in Drizzle's migration tracking table rather than
-- actually run, so none of the DDL above executes against production again.
-- The block below (pg_trgm + generated tsvector + GIN/btree indexes) mirrors
-- the equivalent hand-appended raw SQL from the old Prisma migration and is
-- already live; it's included here purely for historical documentation.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "SearchItem_title_trgm_idx" ON "SearchItem" USING GIN ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "SearchItem_participants_trgm_idx" ON "SearchItem" USING GIN ("participants" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "SearchItem"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("snippet", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("bodyText", '')), 'C')
  ) STORED;--> statement-breakpoint
CREATE INDEX "SearchItem_search_vector_idx" ON "SearchItem" USING GIN ("searchVector");--> statement-breakpoint
CREATE INDEX "SearchItem_user_updated_idx" ON "SearchItem" ("userId", "updatedAt" DESC);