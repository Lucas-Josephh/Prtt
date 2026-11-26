/*
  Warnings:

  - Added the required column `registrationEndAt` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tabMax` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Table` ADD COLUMN `extra` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Tournament` ADD COLUMN `registrationEndAt` DATETIME(3) NOT NULL,
    ADD COLUMN `tabMax` INTEGER NOT NULL;
