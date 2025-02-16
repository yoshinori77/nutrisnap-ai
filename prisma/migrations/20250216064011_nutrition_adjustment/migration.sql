-- CreateTable
CREATE TABLE "NutritionAdjustment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NutritionAdjustment_user_id_date_key" ON "NutritionAdjustment"("user_id", "date");
