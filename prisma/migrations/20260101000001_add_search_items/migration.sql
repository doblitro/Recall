-- CreateEnum
CREATE TYPE "SearchItemKind" AS ENUM ('gmail_message', 'drive_file');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('idle', 'running', 'error');

-- CreateTable
CREATE TABLE "SearchItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "kind" "SearchItemKind" NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "snippet" TEXT,
    "bodyText" TEXT,
    "url" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "cursor" TEXT,
    "status" "SyncStatus" NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastFullSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchItem_integrationId_externalId_key" ON "SearchItem"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "SearchItem_userId_idx" ON "SearchItem"("userId");

-- CreateIndex
CREATE INDEX "SearchItem_userId_updatedAt_idx" ON "SearchItem"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCursor_integrationId_key" ON "SyncCursor"("integrationId");

-- AddForeignKey
ALTER TABLE "SearchItem" ADD CONSTRAINT "SearchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchItem" ADD CONSTRAINT "SearchItem_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable trigram extension for fuzzy/substring/prefix matching on short fields.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes on the two short fields we do fuzzy/substring/word-prefix
-- matching against (see lib/search/query.ts). Kept off the larger snippet/
-- bodyText columns deliberately -- trigram index size scales with character
-- count, and full-text (tsvector) is the cheaper, correct primitive there.
CREATE INDEX "SearchItem_title_trgm_idx"
  ON "SearchItem" USING GIN ("title" gin_trgm_ops);

CREATE INDEX "SearchItem_participants_trgm_idx"
  ON "SearchItem" USING GIN ("participants" gin_trgm_ops);

-- Generated tsvector column over the larger free-text fields, weighted so
-- title matches rank above snippet/body matches within the tsvector tier.
-- STORED so it's maintained automatically on INSERT/UPDATE with no
-- application-level trigger code and no risk of drift. Intentionally NOT
-- declared in schema.prisma (Prisma has no way to express a generated
-- column) -- see the note above the SearchItem model.
ALTER TABLE "SearchItem"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("snippet", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("bodyText", '')), 'C')
  ) STORED;

CREATE INDEX "SearchItem_search_vector_idx"
  ON "SearchItem" USING GIN ("searchVector");

-- Composite btree to support the userId-scoped recency ordering/pagination cheaply.
CREATE INDEX "SearchItem_user_updated_idx"
  ON "SearchItem" ("userId", "updatedAt" DESC);
