-- AlterTable
ALTER TABLE `Player` ADD COLUMN `licence` VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Player_tableId_licence_key` ON `Player`(`tableId`, `licence`);
