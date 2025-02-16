/*
  Warnings:

  - You are about to drop the `NutritionAdjustment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "NutritionAdjustment";

-- CreateTable
CREATE TABLE "nutrition_adjustment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_adjustment_user_id_date_key" ON "nutrition_adjustment"("user_id", "date");
