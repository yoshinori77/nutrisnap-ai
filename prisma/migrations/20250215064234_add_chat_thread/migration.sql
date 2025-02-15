/*
  Warnings:

  - The required column `thread_id` was added to the `chat_history` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "chat_history" ADD COLUMN     "thread_id" TEXT NOT NULL;
