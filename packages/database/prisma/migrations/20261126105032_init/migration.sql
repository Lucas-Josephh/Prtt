-- CreateTable
CREATE TABLE "AdminUser" (
    "id" CHAR(32) NOT NULL,
    "identifier" VARCHAR(191) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Desk" (
    "id" CHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "email" VARCHAR(191) NOT NULL,
    "phone" VARCHAR(20),
    "description" TEXT,
    "imageUrl" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Desk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" CHAR(32) NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "content" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tournament" BOOLEAN NOT NULL DEFAULT false,
    "category" VARCHAR(32) NOT NULL DEFAULT 'autre',
    "publishedAt" TIMESTAMPTZ(3),
    "imageUrl" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" CHAR(32) NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "ja" VARCHAR(191) NOT NULL,
    "email" VARCHAR(191),
    "phone" VARCHAR(20),
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "registrationEndAt" TIMESTAMPTZ(3) NOT NULL,
    "tabMax" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" CHAR(32) NOT NULL,
    "tournamentId" CHAR(32) NOT NULL,
    "letter" VARCHAR(10) NOT NULL,
    "minimumCat" VARCHAR(32) NOT NULL,
    "maximumCat" VARCHAR(32) NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "price" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "extra" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" CHAR(32) NOT NULL,
    "tableId" CHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "licence" VARCHAR(20) NOT NULL,
    "ranking" INTEGER NOT NULL,
    "numbered" INTEGER,
    "club" VARCHAR(191) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "phone" VARCHAR(20),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" VARCHAR(191) NOT NULL,
    "hits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_identifier_key" ON "AdminUser"("identifier");

-- CreateIndex
CREATE INDEX "Desk_position_idx" ON "Desk"("position");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_tournament_createdAt_idx" ON "NewsArticle"("tournament", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Table_tournamentId_letter_key" ON "Table"("tournamentId", "letter");

-- CreateIndex
CREATE INDEX "Player_tableId_idx" ON "Player"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_tableId_licence_key" ON "Player"("tableId", "licence");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
