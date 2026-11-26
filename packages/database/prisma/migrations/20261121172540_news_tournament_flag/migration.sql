-- AlterTable
ALTER TABLE `NewsArticle` ADD COLUMN `tournament` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `NewsArticle_tournament_createdAt_idx` ON `NewsArticle`(`tournament`, `createdAt`);
