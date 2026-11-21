-- CreateTable
CREATE TABLE `AdminUser` (
    `id` CHAR(32) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminUser_identifier_key`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Desk` (
    `id` CHAR(32) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `surname` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` CHAR(32) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `category` VARCHAR(32) NOT NULL DEFAULT 'autre',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NewsArticle_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tournament` (
    `id` CHAR(32) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `ja` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Table` (
    `id` CHAR(32) NOT NULL,
    `tournamentId` CHAR(32) NOT NULL,
    `letter` VARCHAR(10) NOT NULL,
    `minimumCat` VARCHAR(32) NOT NULL,
    `maximumCat` VARCHAR(32) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `maxPlayers` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Table_tournamentId_letter_key`(`tournamentId`, `letter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Player` (
    `id` CHAR(32) NOT NULL,
    `tableId` CHAR(32) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `surname` VARCHAR(100) NOT NULL,
    `ranking` INTEGER NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `numbered` INTEGER NULL,
    `club` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Player_tableId_idx`(`tableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Table` ADD CONSTRAINT `Table_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `Table`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
