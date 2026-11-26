/*
  Warnings:

  - Added the required column `role` to the `Desk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Desk` ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `role` VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE INDEX `Desk_position_idx` ON `Desk`(`position`);
