/*
  Warnings:

  - Added the required column `activity_factor` to the `user_profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_profile" ADD COLUMN "activity_factor" FLOAT NOT NULL DEFAULT 1.2;
